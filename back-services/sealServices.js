import { sendSignedHttp } from "./httpSignature";
import { generateLinkedCredential } from "../model/credentialModel";
import session from "express-session";
const rp = require("request-promise");
const jsesc = require("jsesc");

const keyId =
  "d9db7614221d9d397f98d44f90eb15db5a4e0d842ffadfd7f1651963ccb22437";

const SEAL_SM_URI = process.env.SEAL_SM_URI
  ? process.env.SEAL_SM_URI
  : "vm.project-seal.eu";
const SEAL_SM_PORT = process.env.SEAL_SM_PORT
  ? process.env.SEAL_SM_PORT
  : "9090";

//   const SEAL_SM_URI = process.env.SEAL_SM_URI
//   ? process.env.SEAL_SM_URI
//   : "esmo-gateway.eu";
// const SEAL_SM_PORT = process.env.SEAL_SM_PORT
//   ? process.env.SEAL_SM_PORT
//   : "8090";

const SEAL_EIDAS_URI = process.env.SEAL_EIDAS_URI
  ? process.env.SEAL_EIDAS_URI
  : "vm.project-seal.eu";
const SEAL_EIDAS_PORT = process.env.SEAL_EIDAS_PORT
  ? process.env.SEAL_EIDAS_PORT
  : "8091";
const SEAL_EDUGAIN_URI = process.env.SEAL_EDUGAIN_URI
  ? process.env.SEAL_EDUGAIN_URI
  : "vm.project-seal.eu";
const SEAL_EDUGAIN_PORT = process.env.SEAL_EDUGAIN_PORT
  ? process.env.SEAL_EDUGAIN_PORT
  : "";

function startSession() {
  console.log("sealService:: startSession");
  // let keyId =
  //   "d9db7614221d9d397f98d44f90eb15db5a4e0d842ffadfd7f1651963ccb22437";
  return new Promise((resolve, reject) => {
    sendSignedHttp(
      SEAL_SM_URI,
      "/sm/startSession",
      "post",
      keyId,
      "application/x-www-form-urlencoded",
      null,
      true,
      SEAL_SM_PORT
    )
      .then((response) => {
        resolve(response.sessionData.sessionId);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

function updateSessionData(sessionId, variableName, variableValue) {
  let updateObject = {
    sessionId: sessionId,
    variableName: variableName,
    dataObject: variableValue,
  };
  return new Promise((resolve, reject) => {
    sendSignedHttp(
      SEAL_SM_URI,
      "/sm/updateSessionData",
      "post",
      keyId,
      "application/json; charset=utf-8",
      updateObject,
      false,
      SEAL_SM_PORT
    )
      .then((response) => {
        console.log(
          `sealService.js pdateSessionData response for variable ${variableName} and value ${variableValue}`
        );
        console.log(response);
        resolve(response.code);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

function validateToken(msToken, counter = 0) {
  return new Promise((resolve, reject) => {
    sendSignedHttp(
      SEAL_SM_URI,
      "/sm/validateToken?token=" + msToken,
      "get",
      keyId,
      "application/x-www-form-urlencoded",
      null,
      false,
      SEAL_SM_PORT
    )
      .then((response) => {
        console.log("sealSErvices.js validateToken:: the response is ");
        console.log(response);

        let sessionId = response.sessionData
          ? response.sessionData.sessionId
          : response.sessionId;
        resolve(sessionId);
      })
      .catch((err) => {
        console.log(err);
        if (counter < 2) {
          resolve(validateToken(msToken, counter + 1));
        } else {
          reject(err);
        }
      });
  });
}

function getSessionData(sessionId, variableName, counter = 0) {
  return new Promise((resolve, reject) => {
    sendSignedHttp(
      SEAL_SM_URI,
      "/sm/getSessionData?sessionId=" + sessionId,
      "get",
      keyId,
      "application/x-www-form-urlencoded",
      null,
      false,
      SEAL_SM_PORT
    )
      .then((response) => {
        // console.log(`sealService.js, getSessionDATA::`);
        // console.log(response);

        resolve(response.sessionData.sessionVariables[variableName]);
      })
      .catch((err) => {
        console.log(err);
        if (counter < 2) {
          resolve(getSessionData(sessionId, variableName, counter + 1));
        } else {
          reject(err);
        }
      });
  });
}

function getSessionNewData(sessionId, counter = 0) {
  return new Promise((resolve, reject) => {
    let queryObject = {
      sessionId: sessionId,
    };

    sendSignedHttp(
      SEAL_SM_URI,
      "/sm/new/get?sessionId=" + sessionId,
      "post",
      keyId,
      "application/json",
      queryObject,
      false,
      SEAL_SM_PORT
    )
      .then((response) => {
        resolve(response);
      })
      .catch((err) => {
        console.log(err);
        if (counter < 2) {
          resolve(getSessionNewData(sessionId, counter + 1));
        } else {
          reject(err);
        }
      });
  });
}

function generateToken(sessionId, sender, receiver, counter = 0) {
  return new Promise((resolve, reject) => {
    sendSignedHttp(
      SEAL_SM_URI,
      `/sm/generateToken?sender=${sender}&receiver=${receiver}&sessionId=${sessionId}`,
      "get",
      keyId,
      "application/x-www-form-urlencoded",
      null,
      false,
      SEAL_SM_PORT
    )
      .then((resp) => {
        console.log(resp);
        resolve(resp);
      })
      .catch((err) => {
        console.log(err);
        if (counter < 2) {
          resolve(generateToken(sessionId, sender, receiver, counter + 1));
        } else {
          reject(err);
        }
      });
  });
}

function autoLinkRequest(sessionId, setA = null, setB = null, counter = 0) {
  let dataSetA = setA;
  let dataSetB = setB;

  console.log("autolinkRequest");
  // console.log("linking:")
  // console.log(dataSetA)
  // console.log("with")
  // console.log(dataSetB)

  return new Promise(async (resolve, reject) => {
    let dsa = dataSetA;
    // dsa.given_name="CHRISTINA, PALIOKOSTA"
    // dsa.family_name=  "PALIOKOSTA"
    let dsb = dataSetB;
    if (dataSetA === null) {
      dsa = {
        id: "6c0f70a8-f32b-4535-b5f6-0d596c52813a",
        type: "eIDAS",
        categories: [],
        issuerId: "Issuer",
        subjectId: "PersonIdentifier",
        loa: "4",
        issued: "2018-12-06T19:40:16Z",
        expiration: "2018-15-06T19:45:16Z",
        attributes: [
          {
            name:
              "http://eidas.europa.eu/attributes/naturalperson/CurrentGivenName",
            friendlyName: "GivenName",
            encoding: "plain",
            language: null,
            mandatory: true,
            values: ["FRANCISCO JOSE"],
          },
          {
            name:
              "http://eidas.europa.eu/attributes/naturalperson/CurrentFamilyName",
            friendlyName: "FamilyName",
            encoding: "plain",
            language: null,
            mandatory: true,
            values: ["ARAGO MONZONIS"],
          },
          {
            name:
              "http://eidas.europa.eu/attributes/naturalperson/PersonIdentifier",
            friendlyName: "PersonIdentifier",
            encoding: "plain",
            language: null,
            mandatory: true,
            values: ["GR/ES/12345678A"],
          },
          {
            name: "http://eidas.europa.eu/attributes/naturalperson/DateOfBirth",
            friendlyName: "DateOfBirth",
            encoding: "plain",
            language: null,
            mandatory: true,
            values: ["1984-07-24"],
          },
          {
            name: "Issuer",
            friendlyName: "Issuer",
            encoding: "plain",
            language: null,
            mandatory: true,
            values: ["https://eidas.redsara.es/EidasNode/ServiceMetadata"],
          },
        ],
        properties: {
          test: "test value",
        },
      };
    }

    if (dataSetB === null) {
      dsb = {
        id: "6c0f70a8-f32b-4535-b5f6-0d596c5281aa",
        type: "eduGAIN",
        categories: [],
        issuerId: "Issuer",
        subjectId: "schacPersonalUniqueCode",
        loa: "2",
        issued: "2018-12-06T19:40:16Z",
        expiration: "2018-15-06T19:45:16Z",
        attributes: [
          {
            name: "displayName",
            friendlyName: null,
            encoding: "plain",
            language: null,
            mandatory: true,
            values: ["Francisco Jose Arago Monzonis"],
          },
          {
            name: "schacHomeOrganization",
            friendlyName: null,
            encoding: "plain",
            language: null,
            mandatory: true,
            values: ["rediris.es"],
          },
          {
            name: "givenName",
            friendlyName: null,
            encoding: "plain",
            language: null,
            mandatory: true,
            values: ["Francisco Jose"],
          },
          {
            name: "surname",
            friendlyName: null,
            encoding: "plain",
            language: null,
            mandatory: true,
            values: ["Arago Monzonis"],
          },
          {
            name: "commonName",
            friendlyName: null,
            encoding: "plain",
            language: null,
            mandatory: true,
            values: ["Francisco Jose Arago Monzonis"],
          },
          {
            name: "schacPersonalUniqueCode",
            friendlyName: "schacPersonalUniqueCode",
            encoding: "plain",
            language: null,
            mandatory: true,
            values: [
              "urn:mace:terena.org:schac:personalUniqueCode:es:rediris:sir:mbid:{md5}fde3899abda05086e6a675518ea6a3f1",
            ],
          },
          {
            name: "Issuer",
            friendlyName: "Issuer",
            encoding: "plain",
            language: null,
            mandatory: true,
            values: [
              "https://idp.rediris.es/module.php/saml2/idp/metadata.xml",
            ],
          },
        ],
        properties: {},
      };
    }

    dsa.id = "someId";
    dsb.id = "someId";
    dsa.issuerId = "issuerEntityId";
    dsb.issuerId = "issuerEntityId2";
    dsa.subjectId = "PersonIdentifier";
    dsb.subjectId = "urn:oid:1.3.6.1.4.1.5923.1.1.1.6";
    dsa.categories = [];
    dsb.categories = [];
    dsa.loa = "low";
    dsb.loa = "low";

    dsa.attributes.forEach((element) => {
      if (element.friendlyName === "CurrentGivenName") {
        element.friendlyName === "GivenName";
      }
    });
    dsa.attributes.push({
      name: "issuerEntityId",
      friendlyName: "issuerEntityId",
      encoding: "null",
      language: "null",
      values: ["https://eidas.gov.gr"],
      mandatory: true,
    });
    dsb.attributes.push({
      name: "issuerEntityId2",
      friendlyName: "issuerEntityId",
      encoding: "null",
      language: "null",
      values: ["https://eid-proxy.aai-dev.grnet.gr/Saml2IDP/proxy.xml"],
      mandatory: true,
    });

    //store linkRequest to session
    let linkRequest = {
      id: null,
      uri: null,
      issuer: null,
      lloa: null,
      type: null,
      issued: null,
      expiration: null,
      evidence: null,
      conversation: null,
      datasetA: dsa,
      datasetB: dsb,
    };
    // console.log("sealService.js the link request is")
    // console.log(linkRequest)
    await updateSessionData(
      sessionId,
      "linkRequest",
      jsesc(linkRequest, {
        json: true,
      })
    );
    console.log("sealService.js sessiondata updated with link request");

    await updateSessionData(
      sessionId,
      "ClientCallbackAddr",
      "http://mock.callback.com"
    );
    console.log(
      "sealService.js sessiondata updated with mock ClientCallbackAddr"
    );

    let sender = process.env.SENDER ? process.env.SENDER : "eIDAS-IdP";
    let receiver = process.env.RECEIVER
      ? process.env.RECEIVER
      : "autoSEAL_ms001";
    let linkRequestEndpoint = process.env.LINK_END
      ? `${process.env.LINK_END}/link/request/submit`
      : "https://vm.project-seal.eu:9050/link/request/submit";
    let requestId = "";

    sendSignedHttp(
      SEAL_SM_URI,
      `/sm/generateToken?sender=${sender}&receiver=${receiver}&sessionId=${sessionId}`,
      "get",
      keyId,
      "application/x-www-form-urlencoded",
      null,
      false,
      SEAL_SM_PORT
    )
      .then((resp) => {
        //https://vm.project-seal.eu:9050/test/client/submit
        console.log("sealService.js generateToken to proceed with linking ok");
        console.log(resp.additionalData);
        rp.post(linkRequestEndpoint, {
          form: {
            msToken: resp.additionalData,
          },
        })
          .then(async (resp) => {
            console.log("sealService.js::: upload linkRequest response");
            console.log(resp);
            let linkRequest = await getSessionData(sessionId, "linkRequest", 2);
            requestId = JSON.parse(linkRequest).id;

            console.log(`the link request updated is`);
            console.log(linkRequest);

            // console.log(`link request Id is ${requestId}`)
            let linkResponseEndpoint = process.env.LINK_END
              ? `${process.env.LINK_END}/link/${requestId}/status`
              : `https://vm.project-seal.eu:9050/link/${requestId}/status`;

            console.log(
              "123**** trying to connect to ****" + linkResponseEndpoint
            );
            // let linkURI = process.env.LINK_END?process.env.LINK_END:SEAL_SM_URI
            let linkPath = `/link/${requestId}/status`
            sendSignedHttp(
              process.env.LINK_URI?process.env.LINK_URI:'vm.project-seal.eu',
              linkPath,
              "get",
              keyId,
              "application/x-www-form-urlencoded",
              null,
              null,
              "9050",
              true
            )
              .then((resp) => {
                console.log(
                  `sealservice.js the linking request response is:::`
                );
                console.log(resp);
                let code = resp.secondaryCode;
                if (code === "ACCEPTED") {
                  sendSignedHttp(
                    SEAL_SM_URI,
                    `/sm/generateToken?sender=${sender}&receiver=${receiver}&sessionId=${sessionId}`,
                    "get",
                    keyId,
                    "application/x-www-form-urlencoded",
                    null,
                    false,
                    SEAL_SM_PORT
                  )
                    .then((resp) => {
                      let token = resp.additionalData;
                      // console.log(token)
                      let linkResponseEndpoint = process.env.LINK_END
                        ? `${process.env.LINK_END}/link/${requestId}/result/get`
                        : `https://vm.project-seal.eu:9050/link/${requestId}/result/get`;

                      console.log(
                        "**** trying to connect to ****" + linkResponseEndpoint
                      );
                      rp.post(linkResponseEndpoint, {
                        form: {
                          msToken: token,
                        },
                      })
                        .then(async (resp) => {
                          console.log("*** FINAL CHECK ****");
                          let linkResultData = JSON.parse(
                            await getSessionData(sessionId, "linkRequest", 2)
                          );
                          console.log(`the link request updated is:::::`);
                          console.log(linkResultData);
                          console.log("*** FINAL CHECK ****");
                          let wasLinkOK = linkResultData.uri;
                          if (wasLinkOK) {
                            let result = generateLinkedCredential(
                              JSON.parse(linkRequest),
                              "SEAL-EDUGAIN-EIDAS"
                            );
                            resolve(result);
                          } else {
                            reject("linking failed");
                          }
                        })
                        .catch((err) => {
                          console.log("1<------*******************--->");
                          console.log("sealService.js:: ");
                          console.log(err);
                          reject("linking failed internral");
                          console.log("<------*******************--->");
                        });
                    })
                    .catch((err) => {
                      console.log("sealService.js:: ");
                      console.log(err);
                      reject("linking failed");
                    });
                } else {
                  console.log(
                    `the linking failed with code ${resp.primaryCode}`
                  );
                  reject("linking failed");
                }
              })
              .catch((err) => {
                console.log("2------*******************---");
                console.log("sealService.js:: ");
                console.log(err);
                reject("linking failed external");
                console.log("-----*******************------");
              });
          })
          .catch((err) => {
            console.log("3------*******************---");
            console.log("sealService.js:: ");
            console.log(err);
            reject("linking failed external");
            console.log("-----*******************------");
          });
      })
      .catch((err) => {
        console.log("4*******************");
        console.log(err);
        console.log("*******************");
        if (counter < 2) {
          resolve(autoLinkRequest(sessionId, datasetA, datasetB, counter + 1));
        } else {
          reject(err);
        }
      });
  });
}

export {
  validateToken,
  updateSessionData,
  startSession,
  getSessionData,
  generateToken,
  getSessionNewData,
  autoLinkRequest,
};

/*

example:: https://github.com/EC-SEAL/reconciliation/blob/master/test/data/testLinkRequest.json

{
"id": "6c0f70a8-f32b-4535-b5f6-0d596c52813a", Unique identifier of the set
"issuer": "string", Name of the entity that issued the link
"type": "string", Type of set
"lloa": "string", Level of certainty that both subjects are the same person
"issued": "2018-12-06T19:40:16Z",  Date when the link was certified (the date this data set was issued)
"expiration": "2018-12-06T19:45:16Z",
"datasetA": {
"id": "6c0f70a8-f32b-4535-b5f6-0d596c52813a",
"type": "string",
"categories": [
"string"
],
"issuerId": "string",
"subjectId": "string",
"loa": "string",
"issued": "2018-12-06T19:40:16Z",
"expiration": "2018-12-06T19:45:16Z",
"attributes": [
{
"name": "http://eidas.europa.eu/attributes/naturalperson/CurrentGivenName",
"friendlyName": "CurrentGivenName",
"encoding": "plain",
"language": "ES_es",
"mandatory": true,
"values": [
"JOHN"
]
}
],
"properties": {
"additionalProp1": "string",
"additionalProp2": "string",
"additionalProp3": "string"
}
},
"datasetB": {
"id": "6c0f70a8-f32b-4535-b5f6-0d596c52813a",
"type": "string",
"categories": [
"string"
],
"issuerId": "string",
"subjectId": "string",
"loa": "string",
"issued": "2018-12-06T19:40:16Z",
"expiration": "2018-12-06T19:45:16Z",
"attributes": [
{
"name": "http://eidas.europa.eu/attributes/naturalperson/CurrentGivenName",
"friendlyName": "CurrentGivenName",
"encoding": "plain",
"language": "ES_es",
"mandatory": true,
"values": [
"JOHN"
]
}
],
"properties": {
"additionalProp1": "string",
"additionalProp2": "string",
"additionalProp3": "string"
}
},
"evidence": [   //List of additional files uploaded to the validator to check the person behind the identities
        items:
{
"filename": "string",
"fileID": "string",
"contentType": "string",
"fileSize": 0,
"content": "string"
}
],
"conversation": [  List of messages exchanged between the requester and the validation officer
{
"timestamp": 0,
"sender": "string",
"senderType": "string",
"recipient": "string",
"recipientType": "string",
"message": "string"
}
]
}

*/
