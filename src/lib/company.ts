import type { Company } from './types'

/**
 * Company details printed on every document.
 * PLACEHOLDERS: phone, TIN and bank details are not real yet. Phase 2 moves all of this into Settings.
 */
export const company: Company = {
  name: 'Digital Dive Pvt Ltd',
  address: ['Malé', 'Republic of Maldives'],
  phone: '+960 000 0000',
  email: 'info@digitaldive.agency',
  website: 'digitaldive.agency',
  tin: '0000000GST000',
  bankAccounts: {
    MVR: { bankName: 'Bank of Maldives', accountName: 'Digital Dive Pvt Ltd', accountNumber: '7700-000000-000' },
    USD: { bankName: 'Bank of Maldives', accountName: 'Digital Dive Pvt Ltd', accountNumber: '7700-000000-001' },
  },
}
