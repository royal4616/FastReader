import { test, expect } from '@playwright/test'

const PDF_B64 = 'JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL0xlbmd0aCA1MCA+PgpzdHJlYW0KQlQgL0YxIDI0IFRmIDcyIDcyMCBUZCAoRkFTVFJFQURFUiBQREYgVEVTVCkgVGogRVQKZW5kc3RyZWFtCmVuZG9iagozIDAgb2JqCjw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbNCAwIFJdIC9Db3VudCAxID4+CmVuZG9iago0IDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9QYXJlbnQgMyAwIFIgL01lZGlhQm94IFswIDAgNjEyIDc5Ml0gL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgMSAwIFIgPj4gPj4gL0NvbnRlbnRzIDIgMCBSID4+CmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAzIDAgUiA+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3OSAwMDAwMCBuIAowMDAwMDAwMjM2IDAwMDAwIG4gCjAwMDAwMDAzNjIgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDUgMCBSID4+CnN0YXJ0eHJlZgo0MTEKJSVFT0YK'
const DOCX_B64 = 'UEsDBBQAAAAIAGJjM115bjPX6AAAAK0BAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbH1QyU7DMBD9FWuuKHHggBCK0wPLETiUDxjZk8SqN3nc0v49Tlt6QIXjzFv1+tXeO7GjzDYGBbdtB4KCjsaGScHn+rV5AMEFg0EXAyk4EMNq6NeHRCyqNrCCuZT0KCXrmTxyGxOFiowxeyz1zJNMqDc4kbzrunupYygUSlMWDxj6Zxpx64p42df3qUcmxyCeTsQlSwGm5KzGUnG5C+ZXSnNOaKvyyOHZJr6pBJBXExbk74Cz7r0Ok60h8YG5vKGvLPkVs5Em6q2vyvZ/mys94zhaTRf94pZy1MRcF/euvSAebfjpL49zD99QSwMEFAAAAAgAYmMzXZv9N+qtAAAAKQEAAAsAAABfcmVscy8ucmVsc43POw7CMAwG4KtE3mlaBoRQ0y4IqSsqB7ASN61oHkrCo7cnAwNFDIy2f3+W6/ZpZnanECdnBVRFCYysdGqyWsClP232wGJCq3B2lgQsFKFt6jPNmPJKHCcfWTZsFDCm5A+cRzmSwVg4TzZPBhcMplwGzT3KK2ri27Lc8fBpwNpknRIQOlUB6xdP/9huGCZJRydvhmz6ceIrkWUMmpKAhwuKq3e7yCzwpuarF5sXUEsDBBQAAAAIAGJjM13BxGD/sAAAAOgAAAARAAAAd29yZC9kb2N1bWVudC54bWxFjsEOgjAMhl9l2V2GHowhgDEKV41i4nVuVUlYS9Yp+vYyPHj5mv5/86X5+u068QLPLWEh50kqBaAh2+K9kOemnq2k4KDR6o4QCvkBlusyHzJL5ukAgxgFyNlQyEcIfaYUmwc4zQn1gGN3I+90GFd/VwN523sywDz6XacWabpUTrcoo/JK9hNnH+EjQllvTs2x2uyqo9jttxfRVKcmV7GJ9BOnewYTDl5NwU+k/k+WX1BLAQIUAxQAAAAIAGJjM115bjPX6AAAAK0BAAATAAAAAAAAAAAAAACAAQAAAABbQ29udGVudF9UeXBlc10ueG1sUEsBAhQDFAAAAAgAYmMzXZv9N+qtAAAAKQEAAAsAAAAAAAAAAAAAAIABGQEAAF9yZWxzLy5yZWxzUEsBAhQDFAAAAAgAYmMzXcHEYP+wAAAA6AAAABEAAAAAAAAAAAAAAIAB7wEAAHdvcmQvZG9jdW1lbnQueG1sUEsFBgAAAAADAAMAuQAAAM4CAAAAAA=='
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAnAAAABICAIAAAD5x18dAAADTUlEQVR42u3VgRHEIAwDMPZfms5Ar5QEqwP88YljjbH5m5u/tHd+9f5x6JuXfl3m1n3vafNM2zuPgApUoCpWoNo7UIEKVKAqVqDaO1CBClSgAhWoQAUqUIEKVKAqVqDaO1CBClSgKlag2jtQgQpUoAIVqPYOVKACFahABSpQgdqn57sUVrXfvxWSNCDl0zy9096BKrhAlU/FClR7B6rgAtV85NM87R2oBg1UoMqnedo7UA0aqECVT/P0TnsHquACVT4VK1DtHaiCCwzzkU/ztHegGjRQffJpnvYOVKACFajy6d6Bau9AFVygyqdiBaq9A1VwgQFU+TRPeweqQQMVqPJpnt4JVKAKrv8ln+4dqPYOVMEFKlAVK1DtHagODBhAlU/ztHegGjRQgSqf5umdQF0DdfU7NejdX7X3A7UXqLfmsPs7gSqfpXsAqEAFqsICKlCBClSgAhVUQAWqfAIVqEAFqncC1d6BClSgAlVhARWoQAUqUH0KC6hABSpQgQpUUAEVqPIJVKACFajeCVR7b+BUl8JKA6NaUFD6bj72eDdUae9MuyOgKhqgKgI5BypQgQpURQxUOQcqUIEKVKAC1R5BBVSgOjCgAhWo7t073RFQFQ1QFYGcAxWoQAWqIgYqUIEKVKACFahABSpQgQpUBwZUoCpo9+6d7gioigaoikDO7QuoQFU0QAWqnIMKqEAFKlCBClSgAgaoDswcgKqg3bt3uiOgKhqgKgI5ty97B6qiASpQ5RxUQAWqAwMqUIEKVKAC1YH9scivvjTI00Dtnk9Q1bx3ez/7+0AFKlDlU7EC1d6B6sCAKp+K1b3bO1AdGFCBClTzBCpQFRZQgQpUoAIVqEAFKlDlU7EC1d6B6sCAKp+K1b3bO1AdGFCBClTzBCpQFRZQgSqfQAUqUIEKVKDKp2IFqr0D1YEBVT4Vq3u3d6A6MKACFajmCVSgKiygolQ+gQpUoAIVqECVT8UKVHsHqgMDqnwC1b3bO1AVFlCBClTzBCpQFRZQgSqfihWoQAWqAwOqfCpWoNo7UB0YUIEKVPdu70BVWEAFKlDNE6hAVVhABap8Klag2jtQHRhQ5VOxAtXegerAgApUoLp3oAJVYQEVqEA1T6AGgPoAORMrmXeBdjkAAAAASUVORK5CYII='

function b64(value) {
  return Buffer.from(value, 'base64')
}

async function upload(page, name, mimeType, buffer) {
  await page.getByTestId('file-input').setInputFiles({ name, mimeType, buffer })
  await expect(page.getByTestId('status')).toContainText('Loaded', { timeout: 120000 })
}

test.describe('FastReader import pipeline', () => {
  test('accepts exactly 10,000 words and rejects 10,001', async ({ page }) => {
    await page.goto('./')
    const textarea = page.getByLabel('Your text')
    await textarea.fill(Array(10000).fill('word').join(' '))
    await expect(page.getByTestId('word-count')).toHaveText('10,000')
    await textarea.fill(Array(10001).fill('word').join(' '))
    await expect(page.getByTestId('error')).toContainText('maximum of 10,000 words')
    await expect(page.getByTestId('word-count')).toHaveText('10,000')
  })

  test('imports a TXT file', async ({ page }) => {
    await page.goto('./')
    await upload(page, 'sample.txt', 'text/plain', Buffer.from('FASTREADER TXT TEST'))
    await expect(page.getByTestId('word-count')).toHaveText('3')
  })

  test('extracts text from a DOCX file', async ({ page }) => {
    await page.goto('./')
    await upload(page, 'sample.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', b64(DOCX_B64))
    await expect(page.getByTestId('word-count')).toHaveText('3')
  })

  test('extracts text from a PDF file', async ({ page }) => {
    await page.goto('./')
    await upload(page, 'sample.pdf', 'application/pdf', b64(PDF_B64))
    await expect(page.getByTestId('word-count')).toHaveText('3')
  })

  test('OCRs an image file', async ({ page }) => {
    await page.goto('./')
    await page.getByTestId('file-input').setInputFiles({
      name: 'sample.png',
      mimeType: 'image/png',
      buffer: b64(PNG_B64)
    })
    await expect(page.getByTestId('status')).toContainText('Loaded', { timeout: 120000 })
    await expect(page.getByTestId('word-count')).not.toHaveText('0')
  })
})
