import { ClaimsMetadataSummary } from './types'

export { BaseMetadata, ContextEntry, ClaimInterface } from './types'

export const claimsMetadata: ClaimsMetadataSummary = {
  emailAddress: {
    type: ['Credential', 'ProofOfEmailCredential'],
    name: 'Email address',
    context: [
      {
        ProofOfEmailCredential: 'https://identity.jolocom.com/terms/ProofOfEmailCredential',
        schema: "http://schema.org/",
        email: "schema:email"
      }
    ]
  },
  mobilePhoneNumber: {
    type: ['Credential', 'ProofOfMobilePhoneNumberCredential'],
    name: 'Mobile Phone Number',
    context: [
      {
        ProofOfMobilePhoneNumberCredential: 'https://identity.jolocom.com/terms/ProofOfMobilePhoneNumberCredential',
        telephone: "http://schema.org/telephone"
      }
    ]
  },
  name: {
    type: ['Credential', 'ProofOfNameCredential'],
    name: 'Name',
    context: [
      {
        ProofOfNameCredential: 'https://identity.jolocom.com/terms/ProofOfNameCredential',
        schema: "http://schema.org/",
        familyName: "schema:familyName",
        givenName: "schema:givenName"
      }
    ]
  },
  publicProfile: {
    type: ['Credential', 'PublicProfileCredential'],
    name: 'Public Profile',
    context: [
      {
        PublicProfileCredential: 'https://identity.jolocom.com/terms/PublicProfileCredential',
        schema: "http://schema.org/",
        name: "schema:name",
        description: "schema:description",
        image: "schema:image",
        url: "schema:url"
      }
    ]
  },
  postalAddress: {
    type: ['Credential', 'ProofOfPostalAddressCredential'],
    name: 'Postal Address',
    context: [
      {
        ProofOfPostalAddressCredential: 'https://identity.jolocom.com/terms/ProofOfPostalAddressCredential',
        schema: "http://schema.org/",
        addressLine1: "schema:streetAddress",
        addressLine2: "schema:streetAddress",
        postalCode: "schema:postalCode",
        city: "schema:addressLocality",
        country: "schema:addressCountry"
      }
    ]
  }
}
