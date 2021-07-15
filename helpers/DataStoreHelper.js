//TODO, handle multiple values???
function findAttributeByFriendlyName(attributeArray, attrName) {
  let result = attributeArray.find((cd) => {
    return cd.friendlyName === attrName;
  });
  // console.log(`the result is ${result}`)
  // console.log(result)
  return result ? (result.values ? result.values[0] : result.values) : null;
}

function makeUserDetails(dataStore) {
  const response = {};

  console.log(`DataStoreHelper --- makeUserDetails::`);
  console.log(dataStore);

  if (
    (dataStore.clearData && dataStore.clearData.length > 0) ||
    dataStore.issuer === "edugainIDPms_001"
  ) {
    let eIDASDataSet = null;
    let eduGAINSet = null;

    if (dataStore.clearData && dataStore.clearData.length > 0) {
      eIDASDataSet = dataStore.clearData.find((cd) => {
        return cd.type === "eIDAS";
      });

      eduGAINSet = dataStore.clearData.find((cd) => {
        return cd.type === "eduGAIN";
      });
    } else {
      eduGAINSet = dataStore;
    }

    if (eIDASDataSet) {
      const eIDASData = eIDASDataSet.attributes;
      console.log(`Datastore helpter -- makeuserdetails-- eidasData`);
      console.log(eIDASData);
      const eIDASUserDetails = {
        given_name: findAttributeByFriendlyName(eIDASData, "GivenName"),
        family_name: findAttributeByFriendlyName(eIDASData, "FamilyName"),
        person_identifier: findAttributeByFriendlyName(
          eIDASData,
          "PersonIdentifier"
        ),
        date_of_birth: findAttributeByFriendlyName(eIDASData, "DateOfBirth"),
        source: "eidas",
        loa: eIDASData.find((attr) => {
          return attr.friendlyName === "loa";
        })
          ? eIDASData.find((attr) => {
              return attr.friendlyName === "loa";
            }).values
          : "low",
      };

      let hostingInstitution = findAttributeByFriendlyName(
        eIDASData,
        "hostingInstitution"
      );
      let expires = findAttributeByFriendlyName(eIDASData, "expires");
      let affiliation = findAttributeByFriendlyName(eIDASData, "affiliation");
      if (hostingInstitution && expires && affiliation) {
        eIDASUserDetails.hostingInstitution = hostingInstitution;
        eIDASUserDetails.expires = expires;
        eIDASUserDetails.affiliation = affiliation;
      }

      response.eidas = eIDASUserDetails;
    }

    if (eduGAINSet) {
      const eduGAIN = eduGAINSet.attributes;
      const eduGAINDetails = {
        schacHomeOrganization: findAttributeByFriendlyName(
          eduGAIN,
          "schacHomeOrganization"
        ),
        eduPersonTargetedID: findAttributeByFriendlyName(
          eduGAIN,
          "eduPersonTargetedID"
        ),
        schGrAcPersonID: findAttributeByFriendlyName(
          eduGAIN,
          "schGrAcPersonID"
        ),
        uid: findAttributeByFriendlyName(eduGAIN, "uid"),
        schacGender: findAttributeByFriendlyName(eduGAIN, "schacGender"),
        schacYearOfBirth: findAttributeByFriendlyName(
          eduGAIN,
          "schacYearOfBirth"
        ),
        schacDateOfBirth: findAttributeByFriendlyName(
          eduGAIN,
          "schacDateOfBirth"
        ),
        schacCountryOfCitizenship: findAttributeByFriendlyName(
          eduGAIN,
          "schacCountryOfCitizenship"
        ),
        schGrAcPersonSSN: findAttributeByFriendlyName(
          eduGAIN,
          "schGrAcPersonSSN"
        ),
        schacPersonalUniqueID: findAttributeByFriendlyName(
          eduGAIN,
          "schacPersonalUniqueID"
        ),
        eduPersonOrgDN: findAttributeByFriendlyName(eduGAIN, "eduPersonOrgDN"),
        mail: findAttributeByFriendlyName(eduGAIN, "mail"),
        eduPersonAffiliation: findAttributeByFriendlyName(
          eduGAIN,
          "eduPersonAffiliation"
        ),
        eduPersonScopedAffiliation: findAttributeByFriendlyName(
          eduGAIN,
          "eduPersonScopedAffiliation"
        ),
        eduPersonPrimaryAffiliation: findAttributeByFriendlyName(
          eduGAIN,
          "eduPersonPrimaryAffiliation"
        ),
        givenName: findAttributeByFriendlyName(eduGAIN, "givenName"),
        sn: findAttributeByFriendlyName(eduGAIN, "sn"),
        displayName: findAttributeByFriendlyName(eduGAIN, "displayName"),
        schacPersonalPosition: findAttributeByFriendlyName(
          eduGAIN,
          "schacPersonalPosition"
        ),
        schacPersonalUniqueCode: findAttributeByFriendlyName(
          eduGAIN,
          "schacPersonalUniqueCode"
        ),
        schGrAcEnrollment: findAttributeByFriendlyName(
          eduGAIN,
          "schGrAcEnrollment"
        ),
        schGrAcPersonalLinkageID: findAttributeByFriendlyName(
          eduGAIN,
          "schGrAcPersonalLinkageID"
        ),
        eduPersonEntitlement: findAttributeByFriendlyName(
          eduGAIN,
          "eduPersonEntitlement"
        ),
        schGrAcPersonID: findAttributeByFriendlyName(
          eduGAIN,
          "schGrAcPersonID"
        ),
        ou: findAttributeByFriendlyName(eduGAIN, "ou"),
        dc: findAttributeByFriendlyName(eduGAIN, "dc"),
        schGrAcEnrollment: findAttributeByFriendlyName(
          eduGAIN,
          "schGrAcEnrollment"
        ),
        eduPersonPrimaryAffiliation: findAttributeByFriendlyName(
          eduGAIN,
          "eduPersonPrimaryAffiliation"
        ),
        mailLocalAddress: findAttributeByFriendlyName(
          eduGAIN,
          "mailLocalAddress"
        ),
        eduPersonOrgDN: findAttributeByFriendlyName(eduGAIN, "eduPersonOrgDN"),
        schacPersonalUniqueCode: findAttributeByFriendlyName(
          eduGAIN,
          "schacPersonalUniqueCode"
        ),
        departmentNumber: findAttributeByFriendlyName(
          eduGAIN,
          "departmentNumber"
        ),
        departmentNumber: findAttributeByFriendlyName(
          eduGAIN,
          "departmentNumber"
        ),
        source: "edugain",
        loa: "low",
      };
      response.edugain = eduGAINDetails;
    }
  }
  return response;
}


function buildDataStoreFromNewAPI(newSessionData) {

  let parsedAdditionalDataArray = null;
  let dataStore = {}
  console.log(newSessionData);
  let additionalData = newSessionData.additionalData;
  if(additionalData){
    parsedAdditionalDataArray = JSON.parse(additionalData);
  }else{
    if(newSessionData.sessionData){
      parsedAdditionalDataArray = JSON.parse(newSessionData.sessionData.
        sessionVariables.dataStore.clearData)
    }else{

    }

    
  }


  
  let eIDASAttributes = null;
  let edugainAttributes = null;

  /*
  { code: 'OK',
  sessionData:
   { sessionId: '2a950b14-a288-44f0-a715-43f55fb117a3',
     sessionVariables:
      { authenticatedSubject:
         '{"id":"9d647c11-46b6-4dc4-a331-025d361ca9bf","type":null,"categories":null,"issuerId":null,"subjectId":null,"loa":null,"issued":null,"expiration":null,"attributes":null,"properties":null}',
        dataStore:
         '{"id":"9d647c11-46b6-4dc4-a331-025d361ca9bf","encryptedData":null,"signature":null,"signatureAlgorithm":null,"encryptionAlgorithm":null,"clearData":[{"id":"7f1488a9-e5b6-416b-906a-833b0283d4dd","type":"eIDAS","categories":null,"issuerId":"eIDAS","subjectId":null,"loa":null,"issued":"Fri, 30 Oct 2020 08:30:57 GMT","expiration":null,"attributes":[{"name":"http://eidas.europa.eu/attributes/naturalperson/CurrentFamilyName","friendlyName":"FamilyName","encoding":"UTF-8","language":"N/A","values":["ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA"]},{"name":"http://eidas.europa.eu/attributes/naturalperson/CurrentGivenName","friendlyName":"GivenName","encoding":"UTF-8","language":"N/A","values":["ΧΡΙΣΤΙΝΑ CHRISTINA"]},{"name":"http://eidas.europa.eu/attributes/naturalperson/DateOfBirth","friendlyName":"DateOfBirth","encoding":"UTF-8","language":"N/A","values":["1980-01-01"]},{"name":"http://eidas.europa.eu/attributes/naturalperson/PersonIdentifier","friendlyName":"PersonIdentifier","encoding":"UTF-8","language":"N/A","values":["GR/GR/ERMIS-58333947"]},{"name":"http://eidas.europa.eu/LoA","friendlyName":"LevelOfAssurance","encoding":"UTF-8","language":"N/A","values":[null]}],"properties":null}]}',
        ClientCallbackAddr: 'https://dss1.aegean.gr/issuer/vc/eidas/response',
        issuerSession: 'QX7FKMrI3ggDiIvxKxZ1KyYeuqWYnbsb',
        DID:
         '{"did":"did:ethr:0x15b7f1bb2ee02b6cd8c3ad2da413d5128e7e933f","pushToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE2MDQwNDY2NDQsImV4cCI6MTYzNTU4MjY0NCwiYXVkIjoiZGlkOmV0aHI6MHhkNTAyYTJjNzFlOGM5MGU4MjUwMGE3MDY4M2Y3NWRlMzhkNTdkZDlmIiwidHlwZSI6Im5vdGlmaWNhdGlvbnMiLCJ2YWx1ZSI6ImFybjphd3M6c25zOnVzLXdlc3QtMjoxMTMxOTYyMTY1NTg6ZW5kcG9pbnQvR0NNL3VQb3J0L2VkYzAxYTFkLWY0MjktM2ZiMy1iZjhmLWIxODgyNzViMGMwMSIsImlzcyI6ImRpZDpldGhyOjB4MTViN2YxYmIyZWUwMmI2Y2Q4YzNhZDJkYTQxM2Q1MTI4ZTdlOTMzZiJ9.jk9sqE5BZxt7DxqR8u1Fv1nBD2NZfPzMhoFIcnYN9FtlsWaJ-uleLDxTq44VYLaY-t5zze88kpdAnqa71vD1xQA","boxPub":"Y6lUE/C/AhZjUa6R0w4s2PKq9OMjs7+/u4nMIIddHno="}' } },
  additionalData: null,
  error: null }
  */

  parsedAdditionalDataArray.forEach((dataSet) => {
    let parsedDataSet = JSON.parse(dataSet.data);

    // console.log(parsedDataSet)

    if (parsedDataSet.type == "eduGAIN") {
      edugainAttributes = {}
      edugainAttributes.type ="eduGAIN"
      edugainAttributes.categories = null
      edugainAttributes.issuerId = "eduGAIN"
      edugainAttributes.subjectId = null
      edugainAttributes.loa = "low"
      edugainAttributes.issued = parsedDataSet.issued
      edugainAttributes.expiration= null
      edugainAttributes.attributes = parsedDataSet.attributes

      // console.log(edugainAttributes)
    }
    if (parsedDataSet.type == "eIDAS") {
      eIDASAttributes = {}
      eIDASAttributes.type ="eIDAS"
      eIDASAttributes.categories = null
      eIDASAttributes.issuerId = "eIDAS"
      eIDASAttributes.subjectId = null
      eIDASAttributes.loa = parsedDataSet.loa
      eIDASAttributes.issued = parsedDataSet.issued
      eIDASAttributes.expiration= null
      eIDASAttributes.attributes = parsedDataSet.attributes
    }
  });
  if (eIDASAttributes && edugainAttributes) {
    dataStore = {}
    dataStore.id="mock"
    dataStore. encryptedData = null
    dataStore.signature = null
    dataStore.signatureAlgorithm= null
    dataStore.encryptionAlgorithm= null
    dataStore.clearData = [ eIDASAttributes,edugainAttributes]
  }else{
    if(edugainAttributes){
      dataStore = {}
    dataStore.id="mock"
    dataStore. encryptedData = null
    dataStore.signature = null
    dataStore.signatureAlgorithm= null
    dataStore.encryptionAlgorithm= null
    dataStore.clearData = [edugainAttributes]
    }else{
      if(edugainAttributes){
        dataStore = {}
      dataStore.id="mock"
      dataStore. encryptedData = null
      dataStore.signature = null
      dataStore.signatureAlgorithm= null
      dataStore.encryptionAlgorithm= null
      dataStore.clearData = [eIDASAttributes]
      } 
    }


  }

  
  
  if(Object.keys(dataStore).length === 0 && dataStore.constructor === Object){
    return null
  }
  
  return dataStore;
}



export { makeUserDetails, buildDataStoreFromNewAPI };
