import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { readdir, stat, rename, mkdir } from 'node:fs/promises'
import { join, basename } from 'node:path'
import {
  COMPANY_IMPORT_QUEUE,
  CompanyImportJobData
} from './company-import.processor'
import {
  PARTNER_IMPORT_QUEUE,
  PartnerImportJobData
} from './partner-import.processor'
import {
  ESTABLISHMENT_IMPORT_QUEUE,
  EstablishmentImportJobData
} from './establishment-import.processor'

export interface FolderWatcherConfig {
  basePath: string
  companiesFolder: string
  partnersFolder: string
  establishmentsFolder: string
  processedFolder: string
  pollIntervalMs: number
}

const DEFAULT_CONFIG: FolderWatcherConfig = {
  basePath: '/home/node/app/imports',
  companiesFolder: 'companies',
  partnersFolder: 'partners',
  establishmentsFolder: 'establishments',
  processedFolder: 'processed',
  pollIntervalMs: 5000
}

@Injectable()
export class FolderWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FolderWatcherService.name)
  private readonly config: FolderWatcherConfig
  private pollInterval: NodeJS.Timeout | null = null
  private isProcessingCompany = false
  private isProcessingPartner = false
  private isProcessingEstablishment = false

  constructor(
    @InjectQueue(COMPANY_IMPORT_QUEUE)
    private readonly companyQueue: Queue<CompanyImportJobData>,
    @InjectQueue(PARTNER_IMPORT_QUEUE)
    private readonly partnerQueue: Queue<PartnerImportJobData>,
    @InjectQueue(ESTABLISHMENT_IMPORT_QUEUE)
    private readonly establishmentQueue: Queue<EstablishmentImportJobData>
  ) {
    this.config = DEFAULT_CONFIG
  }

  async onModuleInit() {
    await this.ensureFoldersExist()
    await this.startWatching()
    this.logger.log(
      `Folder watcher initialized. Monitoring: ${this.config.basePath}`
    )
    this.logger.log(`  - Companies: ${this.getCompaniesPath()}`)
    this.logger.log(`  - Partners: ${this.getPartnersPath()}`)
    this.logger.log(`  - Establishments: ${this.getEstablishmentsPath()}`)
    this.logger.log(`  - Processed: ${this.getProcessedPath()}`)
    this.logger.log(
      `  - Mode: 1 company + 1 partner + 1 establishment in parallel`
    )
  }

  onModuleDestroy() {
    this.stopWatching()
  }

  private getCompaniesPath(): string {
    return join(this.config.basePath, this.config.companiesFolder)
  }

  private getPartnersPath(): string {
    return join(this.config.basePath, this.config.partnersFolder)
  }

  private getEstablishmentsPath(): string {
    return join(this.config.basePath, this.config.establishmentsFolder)
  }

  private getProcessedPath(): string {
    return join(this.config.basePath, this.config.processedFolder)
  }

  private async ensureFoldersExist(): Promise<void> {
    const folders = [
      this.getCompaniesPath(),
      this.getPartnersPath(),
      this.getEstablishmentsPath(),
      this.getProcessedPath()
    ]

    for (const folder of folders) {
      try {
        await mkdir(folder, { recursive: true })
      } catch {
        // Folder already exists
      }
    }
  }

  private async startWatching(): Promise<void> {
    // Use polling to check for new files
    this.pollInterval = setInterval(() => {
      this.checkForNewFiles().catch(err => {
        this.logger.error(`Error checking for files: ${err.message}`)
      })
    }, this.config.pollIntervalMs)

    // Also do an initial check
    await this.checkForNewFiles()
  }

  private stopWatching(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }

    this.logger.log('Folder watcher stopped')
  }

  private async checkForNewFiles(): Promise<void> {
    // Process one company file if not already processing one
    if (!this.isProcessingCompany) {
      const companyFiles = await this.getFilesInFolder(this.getCompaniesPath())
      if (companyFiles.length > 0) {
        this.processCompanyFile(companyFiles[0])
      }
    }

    // Process one partner file if not already processing one
    if (!this.isProcessingPartner) {
      const partnerFiles = await this.getFilesInFolder(this.getPartnersPath())
      if (partnerFiles.length > 0) {
        this.processPartnerFile(partnerFiles[0])
      }
    }

    // Process one establishment file if not already processing one
    if (!this.isProcessingEstablishment) {
      const establishmentFiles = await this.getFilesInFolder(
        this.getEstablishmentsPath()
      )
      if (establishmentFiles.length > 0) {
        this.processEstablishmentFile(establishmentFiles[0])
      }
    }
  }

  private async getFilesInFolder(folderPath: string): Promise<string[]> {
    try {
      const entries = await readdir(folderPath)
      const files: string[] = []

      for (const entry of entries) {
        const fullPath = join(folderPath, entry)
        const stats = await stat(fullPath)

        if (stats.isFile() && !entry.startsWith('.')) {
          files.push(fullPath)
        }
      }

      // Sort by name to process in order (Y0, Y1, Y2, etc.)
      return files.sort((a, b) => a.localeCompare(b))
    } catch {
      return []
    }
  }

  private async processCompanyFile(filePath: string): Promise<void> {
    this.isProcessingCompany = true
    const fileName = basename(filePath)

    try {
      this.logger.log(`[COMPANY] Starting import: ${fileName}`)

      const job = await this.companyQueue.add({
        filePath,
        batchSize: 5000,
        delimiter: ';',
        skipHeader: true
      })

      this.logger.log(`[COMPANY] Job ${job.id} queued for: ${fileName}`)

      // Wait for the job to complete
      await this.waitForQueueToComplete('company')

      // Move file to processed folder
      await this.moveToProcessed(filePath)

      this.logger.log(`[COMPANY] Completed and moved: ${fileName}`)
    } catch (error) {
      this.logger.error(
        `[COMPANY] Error processing ${fileName}: ${error.message}`
      )
    } finally {
      this.isProcessingCompany = false
    }
  }

  private async processPartnerFile(filePath: string): Promise<void> {
    this.isProcessingPartner = true
    const fileName = basename(filePath)

    try {
      this.logger.log(`[PARTNER] Starting import: ${fileName}`)

      const job = await this.partnerQueue.add({
        filePath,
        batchSize: 5000,
        delimiter: ';',
        skipHeader: true
      })

      this.logger.log(`[PARTNER] Job ${job.id} queued for: ${fileName}`)

      // Wait for the job to complete
      await this.waitForQueueToComplete('partner')

      // Move file to processed folder
      await this.moveToProcessed(filePath)

      this.logger.log(`[PARTNER] Completed and moved: ${fileName}`)
    } catch (error) {
      this.logger.error(
        `[PARTNER] Error processing ${fileName}: ${error.message}`
      )
    } finally {
      this.isProcessingPartner = false
    }
  }

  private async processEstablishmentFile(filePath: string): Promise<void> {
    this.isProcessingEstablishment = true
    const fileName = basename(filePath)

    try {
      this.logger.log(`[ESTABLISHMENT] Starting import: ${fileName}`)

      const job = await this.establishmentQueue.add({
        filePath,
        batchSize: 5000,
        delimiter: ';',
        skipHeader: true
      })

      this.logger.log(`[ESTABLISHMENT] Job ${job.id} queued for: ${fileName}`)

      // Wait for the job to complete
      await this.waitForQueueToComplete('establishment')

      // Move file to processed folder
      await this.moveToProcessed(filePath)

      this.logger.log(`[ESTABLISHMENT] Completed and moved: ${fileName}`)
    } catch (error) {
      this.logger.error(
        `[ESTABLISHMENT] Error processing ${fileName}: ${error.message}`
      )
    } finally {
      this.isProcessingEstablishment = false
    }
  }

  private async waitForQueueToComplete(
    type: 'company' | 'partner' | 'establishment'
  ): Promise<void> {
    const queueMap = {
      company: { queue: this.companyQueue, name: 'company-import' },
      partner: { queue: this.partnerQueue, name: 'partner-import' },
      establishment: {
        queue: this.establishmentQueue,
        name: 'establishment-import'
      }
    }

    const { queue, name: queueName } = queueMap[type]

    // Poll until queue is empty
    while (true) {
      const [activeCount, waitingCount] = await Promise.all([
        queue.getActiveCount(),
        queue.getWaitingCount()
      ])

      if (activeCount === 0 && waitingCount === 0) {
        this.logger.log(`[${type.toUpperCase()}] Queue ${queueName} completed`)
        break
      }

      this.logger.log(
        `[${type.toUpperCase()}] Waiting: ${activeCount} active, ${waitingCount} waiting`
      )
      await this.sleep(10000) // Check every 10 seconds
    }
  }

  private async moveToProcessed(filePath: string): Promise<void> {
    const fileName = basename(filePath)
    const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-')
    const newPath = join(this.getProcessedPath(), `${timestamp}_${fileName}`)

    await rename(filePath, newPath)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
