import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface SearchBarProps {
  onSearch: (keyword: string) => void
}

function SearchBar({ onSearch }: SearchBarProps): JSX.Element {
  const { t } = useTranslation()
  const [value, setValue] = useState('')

  const handleChange = (val: string): void => {
    setValue(val)
    onSearch(val)
  }

  return (
    <div style={styles.container}>
      <input
        style={styles.input}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`${t('common.search')}...`}
      />
      {value && (
        <button style={styles.clear} onClick={() => handleChange('')}>
          ✕
        </button>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { position: 'relative', display: 'inline-block' },
  input: {
    padding: '8px 12px',
    paddingRight: '28px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    width: '220px'
  },
  clear: {
    position: 'absolute',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: '#888',
    fontSize: '14px'
  }
}

export default SearchBar
