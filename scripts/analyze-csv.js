#!/usr/bin/env node
/**
 * Script para analisar arquivos CSV e identificar problemas de encoding
 * Uso: node scripts/analyze-csv.js <caminho-do-arquivo>
 */

const fs = require('fs')
const readline = require('readline')

const filePath = process.argv[2]

if (!filePath) {
  console.log('Uso: node scripts/analyze-csv.js <caminho-do-arquivo>')
  process.exit(1)
}

async function analyzeFile(filePath) {
  console.log(`\n📁 Analisando arquivo: ${filePath}`)
  console.log('='.repeat(60))

  const stats = fs.statSync(filePath)
  console.log(`📊 Tamanho: ${(stats.size / (1024 * 1024 * 1024)).toFixed(2)} GB`)

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' })
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  let lineNumber = 0
  let validLines = 0
  let invalidLines = 0
  let nullByteLines = []
  let invalidUtf8Lines = []
  let tooFewFieldsLines = []
  let sampleLines = []
  const delimiter = ';'
  const expectedMinFields = 12

  console.log('\n🔍 Verificando linhas...\n')

  for await (const line of rl) {
    lineNumber++

    // Coletar amostras das primeiras linhas
    if (lineNumber <= 3) {
      sampleLines.push({ num: lineNumber, content: line.substring(0, 200) + '...' })
    }

    // Verificar null bytes (0x00)
    if (line.includes('\x00')) {
      if (nullByteLines.length < 5) {
        nullByteLines.push({ num: lineNumber, sample: line.substring(0, 100) })
      }
      invalidLines++
      continue
    }

    // Verificar caracteres inválidos UTF-8 (usando regex para detectar)
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(line)) {
      if (invalidUtf8Lines.length < 5) {
        invalidUtf8Lines.push({ num: lineNumber, sample: line.substring(0, 100) })
      }
      invalidLines++
      continue
    }

    // Verificar número de campos
    const fields = line.split(delimiter)
    if (fields.length < expectedMinFields) {
      if (tooFewFieldsLines.length < 5) {
        tooFewFieldsLines.push({ num: lineNumber, fields: fields.length, sample: line.substring(0, 100) })
      }
      invalidLines++
      continue
    }

    validLines++

    // Progresso a cada 1M linhas
    if (lineNumber % 1000000 === 0) {
      console.log(`  Processadas ${lineNumber.toLocaleString()} linhas...`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📋 RESULTADO DA ANÁLISE')
  console.log('='.repeat(60))

  console.log(`\n📈 Estatísticas:`)
  console.log(`   Total de linhas: ${lineNumber.toLocaleString()}`)
  console.log(`   Linhas válidas: ${validLines.toLocaleString()} (${((validLines / lineNumber) * 100).toFixed(2)}%)`)
  console.log(`   Linhas inválidas: ${invalidLines.toLocaleString()} (${((invalidLines / lineNumber) * 100).toFixed(2)}%)`)

  if (sampleLines.length > 0) {
    console.log(`\n📝 Primeiras linhas (amostra):`)
    sampleLines.forEach(s => {
      console.log(`   Linha ${s.num}: ${s.content}`)
    })
  }

  if (nullByteLines.length > 0) {
    console.log(`\n⚠️  Linhas com NULL bytes (0x00): ${nullByteLines.length} encontradas`)
    nullByteLines.forEach(l => {
      console.log(`   Linha ${l.num}: ${l.sample}...`)
    })
  }

  if (invalidUtf8Lines.length > 0) {
    console.log(`\n⚠️  Linhas com caracteres de controle inválidos: ${invalidUtf8Lines.length} encontradas`)
    invalidUtf8Lines.forEach(l => {
      console.log(`   Linha ${l.num}: ${l.sample}...`)
    })
  }

  if (tooFewFieldsLines.length > 0) {
    console.log(`\n⚠️  Linhas com poucos campos (<${expectedMinFields}): ${tooFewFieldsLines.length} encontradas`)
    tooFewFieldsLines.forEach(l => {
      console.log(`   Linha ${l.num} (${l.fields} campos): ${l.sample}...`)
    })
  }

  console.log('\n' + '='.repeat(60))

  if (invalidLines === 0) {
    console.log('✅ Arquivo parece estar OK para importação!')
  } else {
    console.log('❌ Arquivo contém problemas que podem causar falha na importação.')
    console.log('\n💡 Sugestões:')
    if (nullByteLines.length > 0) {
      console.log('   - Remover null bytes: sed -i "s/\\x00//g" arquivo.csv')
    }
    if (invalidUtf8Lines.length > 0) {
      console.log('   - Converter encoding: iconv -f LATIN1 -t UTF-8 arquivo.csv > arquivo_utf8.csv')
    }
  }

  console.log('')
}

analyzeFile(filePath).catch(err => {
  console.error('Erro:', err.message)
  process.exit(1)
})
