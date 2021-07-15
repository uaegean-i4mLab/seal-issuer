import { startSession, autoLinkRequest } from "../back-services/sealServices";
const moment = require("moment")
const chai = require("chai");
const expect = chai.expect;


describe("Test parsing of dates for the isErasmus credential, as received by AAS ", async () => {

    it("should complete with no error, DATES", async function () {
        //starting month--JAN--ending month--JUN--duration--4--academicyear==2019-2020--

        let startingMonth = 'JAN'
        let endingMonth = 'JUN'
        let durationOfStay = '4'
        let academicYear = '2019-2020'
        console.log(` starting month--${startingMonth}--ending month--${endingMonth}--duration--${durationOfStay}--academicyear==${academicYear}--`)

        let startingYear = academicYear.split("-")[0]
        let endingYear = academicYear.split("-")[1]
        let activeYear = null
        let activeMonth = null

        let startMonthOfStudy='JAN'

        console.log(`1) startingYear: ${startingYear}, endingYear ${endingYear}, activeYear ${activeYear}, activeMonth ${activeMonth}`)
        if (startMonthOfStudy === "SEP" | "OCT" | "NOV" | "DEC") {
            activeYear = startingYear
            switch (startMonthOfStudy) {
                case "SEP": activeMonth = "09"; break;
                case "OCT": activeMonth = "10"; break;
                case "NOV": activeMonth = "11"; break;
                case "DEC": activeMonth = "12"; break;
            }
        } else {
            activeYear = endingYear
            switch (startMonthOfStudy) {
                case "JAN": activeMonth = "01"; break;
                case "FEB": activeMonth = "02"; break;
                case "MAR": activeMonth = "03"; break;
                case "APR": activeMonth = "04"; break;
                case "MAY": activeMonth = "05"; break;
                case "JUN": activeMonth = "06"; break;
                case "JUL": activeMonth = "07"; break;
                case "AUG": activeMonth = "08"; break;
            }



        }
        console.log(`2)startingYear: ${startingYear}, endingYear ${endingYear}, activeYear ${activeYear}, activeMonth ${activeMonth}`)

        console.log(`active year: ${activeYear} and activemonth ${activeMonth}`)
        let userData = {eidas:{}}
        userData.eidas.affiliation = "UAegean ERASMUS+ Student";
        userData.eidas.hostingInstitution = "University of the Aegean";
        userData.eidas.starts = moment(activeYear + "-" + activeMonth+"-"+"01") //always start the first day of the month
        console.log(`userData.eidas.start ${userData.eidas.starts.format()}`)
        userData.eidas.expires = userData.eidas.starts.add(durationOfStay, 'M')
        console.log(`userData.eidas.start ${userData.eidas.starts.format()}`)
        console.log(`expires ${userData.eidas.expires.format()}`)

        console.log(moment().unix())
        console.log(Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60)

        expect("low").to.equal("low");

       

    })

})