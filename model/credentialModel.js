/*
takes as input a set of requestedData to include in a VC,
together with a VC_TYPE, if it is missing it is a mixed VC type by default, denoting a user selection 
and not a pre-defined  SEAL issuer VC_TYPE
and the data the user has already added to the data source
and generates an appropriate VC model with them
*/
function generateCredentialModel(
  requestedData,
  fetchedData,
  vcType = "SEAL_MIXED"
) {
  console.log(`credentialModel.js:: requested`);
  console.log(requestedData);
  /*
[ { source: 'eidas', key: 'given_name' },
  { source: 'eidas', key: 'family_name' },
  { source: 'eidas', key: 'person_identifier' },
  { source: 'eidas', key: 'date_of_birth' },
  { source: 'eidas', key: 'source' },
  { source: 'eidas', key: 'loa' },

  
  { source: 'eidas', key: 'affiliation' },
  { source: 'eidas', key: 'hostingInstitution' },
  { source: 'eidas', key: 'expires' } ]
*/
  console.log(`credentialModel.js:: fetched`);
  console.log(fetchedData);
  /*
  { eduGAIN: { isStudent: 'true', source: 'eduGAIN', loa: 'low' },
  TAXISnet:
   { name: 'Nikos',
     surname: 'Triantafyllou',
     loa: 'low',
     source: 'TAXISnet' },
  eidas:
   { given_name: 'ΑΝΔΡΕΑΣ, ANDREAS',
     family_name: 'ΠΕΤΡΟΥ, PETROU',
     person_identifier: 'GR/GR/ERMIS-11076669',
     date_of_birth: '1980-01-01',
     source: 'eidas',
     loa: 'http://eidas.europa.eu/LoA/low' } }
  */

  let matchingUserAttributes = requestedData.reduce((initVal, attr) => {
    console.log(
      `CredentialModel.js:: trting to add source: ${attr.source}, key: ${attr.key}  for vc type ${vcType}`
    );
    if (fetchedData[attr.source] && fetchedData[attr.source][attr.key]) {
      console.log(
        `CredentialModel.js:: will add on with ${
          fetchedData[attr.source][attr.key]
        }`
      );
      if (!initVal[vcType]) {
        initVal[vcType] = {};
      }
      if (!initVal[vcType][attr.source]) {
        initVal[vcType][attr.source] = {};
      }
      initVal[vcType][attr.source][attr.key] =
        fetchedData[attr.source][attr.key];
    }
    return initVal;
  }, {});

  // ensure that loa from data sources is always included
  Object.keys(matchingUserAttributes[vcType]).forEach((key) => {
    if (!matchingUserAttributes[vcType][key].loa) {
      matchingUserAttributes[vcType][key].loa = fetchedData[key].loa;
    }
  });

  //ensure that linking LOA is added
  if (Object.keys(matchingUserAttributes[vcType]).length > 1) {
    if (fetchedData.linkLoa) {
      matchingUserAttributes[vcType].linkLoa = fetchedData.linkLoa;
    } else {
      matchingUserAttributes[vcType].linkLoa = "low";
    }
  }

  console.log(
    `CrdentialModel.js:: returning matching attributes ${matchingUserAttributes}`
  );
  console.log(matchingUserAttributes);

  return matchingUserAttributes;
}

function generateLinkedCredential(
  linkedDataSet,
  vcType = "SEAL_eIDAS_EDUGAIN"
) {
  
  console.log("credentialModle.js:: Trying to link");
  // console.log(linkedDataSet);
  linkedDataSet.lloa = "low"

  /*{"id": "99c3a402-2485-4c8a-9a39-f78253275513", 
  "issuer": "SEAL Automated Linker", 
  "type": "linkedID", 
  "lloa": "low", 
  "issued": "2020-08-11T10:42:37.174140", 
  "expiration": null, 
  "datasetA": {"id": "6c0f70a8-f32b-4535-b5f6-0d596c52813a", 
               "type": "eIDAS", 
              "categories": [], 
              "issuerId": "Issuer", 
              "subjectId": "PersonIdentifier", 
              "loa": "4", 
              "issued": "2018-12-06T19:40:16Z", 
              "expiration": "2018-15-06T19:45:16Z", 
              "attributes": [{"name": "http://eidas.europa.eu/attributes/naturalperson/CurrentGivenName", "friendlyName": "CurrentGivenName", "encoding": "plain", "language": null, "mandatory": true, "values": ["FRANCISCO JOSE"]}, 
                             {"name": "http://eidas.europa.eu/attributes/naturalperson/CurrentFamilyName", "friendlyName": "FamilyName", "encoding": "plain", "language": null, "mandatory": true, "values": ["ARAGO MONZONIS"]}, 
                             {"name": "http://eidas.europa.eu/attributes/naturalperson/PersonIdentifier", "friendlyName": "PersonIdentifier", "encoding": "plain", "language": null, "mandatory": true, "values": ["GR/ES/12345678A"]},
                             {"name": "http://eidas.europa.eu/attributes/naturalperson/DateOfBirth", "friendlyName": "DateOfBirth", "encoding": "plain", "language": null, "mandatory": true, "values": ["1984-07-24"]}, 
                             {"name": "Issuer", "friendlyName": "Issuer", "encoding": "plain", "language": null, "mandatory": true, "values": ["https://eidas.redsara.es/EidasNode/ServiceMetadata"]}], "properties": {"test": "test value"}}, 
    "datasetB": {"id": "6c0f70a8-f32b-4535-b5f6-0d596c5281aa", 
                  "type": "eduGAIN", 
                  "categories": [], 
                  "issuerId": "Issuer", 
                  "subjectId": "schacPersonalUniqueCode", 
                  "loa": "2", 
                  "issued": "2018-12-06T19:40:16Z", 
                  "expiration": "2018-15-06T19:45:16Z", 
                  "attributes": [{"name": "displayName", "friendlyName": null, "encoding": "plain", "language": null, "mandatory": true, "values": ["Francisco Jose Arago Monzonis"]}, 
                                {"name": "schacHomeOrganization", "friendlyName": null, "encoding": "plain", "language": null, "mandatory": true, "values": ["rediris.es"]}, 
                                {"name": "givenName", "friendlyName": null, "encoding": "plain", "language": null, "mandatory": true, "values": ["Francisco Jose"]}, 
                                {"name": "surname", "friendlyName": null, "encoding": "plain", "language": null, "mandatory": true, "values": ["Arago Monzonis"]}, 
                                {"name": "commonName", "friendlyName": null, "encoding": "plain", "language": null, "mandatory": true, "values": ["Francisco Jose Arago Monzonis"]}, 
                                {"name": "schacPersonalUniqueCode", "friendlyName": "schacPersonalUniqueCode", "encoding": "plain", "language": null, "mandatory": true, "values": ["urn:mace:terena.org:schac:personalUniqueCode:es:rediris:sir:mbid:{md5}fde3899abda05086e6a675518ea6a3f1"]}, 
                                {"name": "Issuer", "friendlyName": "Issuer", "encoding": "plain", "language": null, "mandatory": true, "values": ["https://idp.rediris.es/module.php/saml2/idp/metadata.xml"]}], 
                "properties": {}}, "evidence": null, "conversation": null}
   */
  let credentialModel = {};
  credentialModel[vcType] = {};
  credentialModel[vcType]["metadata"] = {
    lloa: linkedDataSet.lloa,
    issued: linkedDataSet.issued,
  };

  let datasetAAttributes = linkedDataSet.datasetA.attributes.reduce(
    (total, currentValue) => {
      total[currentValue.name] = currentValue.values[0];
      return total;
    },
    {}
  );
  let datasetBAttributes = linkedDataSet.datasetB.attributes.reduce(
    (total, currentValue) => {
      total[currentValue.name] = currentValue.values[0];
      return total;
    },
    {}
  );

  credentialModel[vcType][linkedDataSet.datasetA.type] = datasetAAttributes;
  credentialModel[vcType][linkedDataSet.datasetB.type] = datasetBAttributes;

  return credentialModel;
}

export { generateCredentialModel, generateLinkedCredential };
