const https = require("https");
import {
    issueCovidVC
  } from "./VCIssuingControllersVCIssuingControllers";



  async function verifyCovid(req, res) {
    let verificationId = req.query.verification;
    let sessionId = req.query.session;

    const reqst = https.get(
      `https://dilosi.services.gov.gr/api/declarations/${verificationId}/`,
      (result) => {
        let body = [];
        result.on("data", (d) => {
          body.push(d);
        });
        result.on("end", function () {
          try {
            body = Buffer.concat(body).toString();
          } catch (e) {
            console.log(e);
          }
          let result = JSON.parse(body).step_info.fields;
          let amka = result.amka.value;
          let firstNameEl = result.first_name_el.value;
          let firstNameEn = result.first_name_en.value;
          let lastNameEl = result.last_name_el.value;
          let lastNameEn = result.last_name_en.value;
          let vaccineType = result.vaccine_type.value;
          let numberOfShots = result.shot_number.value;
          let vaccinationUnitFirstShot = result.vaccination_health_unit_first_shot.value;
          let vaccinationUnitSecondShot = result.vaccination_health_unit_second_shot.value;
          let fistShotDate = result.first_shot_date.value;
          let second_shot_date = result.second_shot_date.value;
          let verificationCode = result.refcode.value;

          let credential = {
            claims: {
                citizen: {
                    el: {
                        name: firstNameEl,     
                        surname:lastNameEl,
                        amka: amka
                    },
                    en: {
                        name: firstNameEn,
                        surname: lastNameEn,
                        amka: amka
                    },
                vaccine: {
                    type: vaccineType,
                    shots: numberOfShots,
                    "first-shot-unit": vaccinationUnitFirstShot,
                    "second-shot-unit": vaccinationUnitSecondShot,
                    "first-shot-date": fistShotDate,
                    "second-shot-date": second_shot_date
                }
                }
            },
            metadata: {
                verificationCode:verificationCode
            }

          }


          issueCovidVC(req, res, JSON.parse(endorsement.did), credential)
        });
      }
    );
    reqst.on("error", (error) => {
      console.error(error);
    });
    reqst.end();
  };


  export {
    verifyCovid
  };