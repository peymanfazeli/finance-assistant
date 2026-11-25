import { Dataset } from '../../core/models/types'
import {
  importCsvDataset,
  importFinaDataset,
  importXlsxDataset,
  isCompleteDatasetCSV,
  isCompleteDatasetWorkbook
} from '../../core/services/DatasetBackupService'
import { DatasetImportError } from '../../core/services/DatasetTransferService'
import { useAppStore } from '../../core/store/useAppStore'

export interface CompleteDatasetBackup {
  dataset: Dataset
  filePath: string
}

export function decodeBase64Text(base64: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new TextDecoder('utf-8').decode(bytes)
}

export async function loadCompleteDatasetBackup(filePath: string): Promise<CompleteDatasetBackup> {
  const result = await window.api.file.read(filePath)
  if (!result.success || !result.data) {
    throw new DatasetImportError(result.error || 'Unable to read the selected file')
  }

  const ext = (result.ext || '').toLowerCase()
  let dataset: Dataset

  if (ext === 'fina' || ext === 'json') {
    dataset = importFinaDataset(decodeBase64Text(result.data))
  } else if (ext === 'xlsx') {
    if (!isCompleteDatasetWorkbook(result.data)) {
      throw new DatasetImportError('This workbook is not a complete dataset backup')
    }
    dataset = importXlsxDataset(result.data)
  } else if (ext === 'csv') {
    const content = decodeBase64Text(result.data)
    if (!isCompleteDatasetCSV(content)) {
      throw new DatasetImportError('This CSV is not a complete dataset backup')
    }
    dataset = importCsvDataset(content)
  } else {
    throw new DatasetImportError('Unsupported backup file type')
  }

  return { dataset, filePath }
}

export async function chooseCompleteDatasetBackup(): Promise<CompleteDatasetBackup | null> {
  const dialogResult = await window.api.dataset.showBackupOpenDialog()
  if (dialogResult.canceled || !dialogResult.filePaths[0]) return null
  return loadCompleteDatasetBackup(dialogResult.filePaths[0])
}

export async function replaceDatasetWithBackup(backup: CompleteDatasetBackup): Promise<Dataset> {
  const store = useAppStore.getState()
  await store.flushDatasetSave()
  await store.setDataset(backup.dataset, backup.filePath)
  useAppStore.getState().setConfigBaseName(backup.dataset.name)
  return backup.dataset
}
