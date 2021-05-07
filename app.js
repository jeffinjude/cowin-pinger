#!/usr/bin/env node
const axios = require('axios');
const argv = require('minimist')(process.argv.slice(2));
const { format } = require('date-fns');
const startOfTomorrow = require('date-fns/startOfTomorrow');
const sound = require("sound-play");
const path = require("path");
const notificationSound = path.join(__dirname, "sounds/amazing_ringtone.mp3");

const defaultInterval = 10; // interval between pings in minutes
const appointmentsListLimit = 5 // Increase/Decrease it based on the amount of information you want in the notification.
let timer = null;
const sampleUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36';

checkParams();

function checkParams() {
    const params = {
        key: "",
        hook: "notify",
        age: "29",
        districtId: "301",
        interval: defaultInterval,
        appointmentsListLimit: appointmentsListLimit,
        date: "07-05-2021,08-05-2021,09-05-2021,10-05-2021,11-05-2021,12-05-2021,13-05-2021,14-05-2021,26-05-2021"
    }

    console.log('\nCowin Pinger started succesfully\n');
    console.log(`IFTTT API Key= ${params.key}`);
    console.log(`IFTTT Hook Name= ${params.hook}`);
    console.log(`Age= ${params.age}`);
    console.log(`District ID= ${params.districtId}`);
    console.log(`Time interval= ${params.interval} minutes (default is 15)`);
    console.log(`Appointment Count= ${params.appointmentsListLimit} (default is 2)\n\n`);

    scheduleCowinPinger(params);
}

function scheduleCowinPinger(params) {
    let pingCount = 0;
    timer = setInterval(() => {
        console.clear();
        pingCount += 1;
        let dataOfPingCount="Ping Count: " + pingCount;
        if(pingCount % 10 == 0) {
            axios.get(`https://maker.ifttt.com/trigger/${params.hook}/with/key/${params.key}?value1=${dataOfPingCount}`).then(() => {
                console.log('Sent Ping count notification');
            });
        }

        pingCowin(params);
        console.log("Ping Count - ", pingCount);
    }, params.interval * 60000);
}

function pingCowin({ key, hook, age, districtId, appointmentsListLimit, date }) {
    let dateArr = date.split(',');
    for(let i = 0; i<dateArr.length; i++) {
        console.log("Pinging public url - ", `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${dateArr[i]}`);
        axios.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${dateArr[i]}`, { headers: { 'User-Agent': sampleUserAgent }}).then((result) => {
            console.log("Pinged public url - ", `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${dateArr[i]}`);
            const { centers } = result.data;
            let isSlotAvailable = false;
            let dataOfSlot = "PUBLIC!!API Date:"+dateArr[i];
            let appointmentsAvailableCount = 0;
            if (centers.length) {
                centers.forEach(center => {
                    center.sessions.forEach((session => {
                        //if (session.min_age_limit < +age && session.available_capacity > 0) {
                        if (session.available_capacity > 0) {
                            isSlotAvailable = true
                            appointmentsAvailableCount++;
                            if (appointmentsAvailableCount <= appointmentsListLimit) {
                                dataOfSlot = `${dataOfSlot}\nSlot for ${session.available_capacity} is available: ${center.name} on ${session.date}`;
                            }
                        }
                    }))
                });

                dataOfSlot = `${dataOfSlot}\n${appointmentsAvailableCount - appointmentsListLimit} more slots available...`
            }
            if (isSlotAvailable) {
                axios.get(`https://maker.ifttt.com/trigger/${hook}/with/key/${key}?value1=${dataOfSlot}`).then(() => {
                    console.log(dataOfSlot);
                    console.log('Sent Notification to Phone');
                    //clearInterval(timer);
                });
            }
        }).catch((err) => {
            console.log("Error Url: " + err.config.url + " Error Msg: " + err.message);
        });

        
        console.log("Pinging private url - ", `https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=${districtId}&date=${dateArr[i]}`);
        axios.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=${districtId}&date=${dateArr[i]}`, { headers: { 'User-Agent': sampleUserAgent }}).then((result) => {
            console.log("Pinged private url - ", `https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=${districtId}&date=${dateArr[i]}`);
            const { centers } = result.data;
            let isSlotAvailable = false;
            let dataOfSlot = "PRIVATE!!API Date:"+dateArr[i];
            let appointmentsAvailableCount = 0;
            if (centers.length) {
                centers.forEach(center => {
                    center.sessions.forEach((session => {
                        //if (session.min_age_limit < +age && session.available_capacity > 0) {
                        if (session.available_capacity > 0) {
                            isSlotAvailable = true
                            appointmentsAvailableCount++;
                            if (appointmentsAvailableCount <= appointmentsListLimit) {
                                dataOfSlot = `${dataOfSlot}\nSlot for ${session.available_capacity} is available: ${center.name} on ${session.date}`;
                            }
                        }
                    }))
                });

                dataOfSlot = `${dataOfSlot}\n${appointmentsAvailableCount - appointmentsListLimit} more slots available...`
            }
            if (isSlotAvailable) {
                axios.get(`https://maker.ifttt.com/trigger/${hook}/with/key/${key}?value1=${dataOfSlot}`).then(() => {
                    console.log(dataOfSlot);
                    console.log('Sent Notification to Phone \nStopping Pinger...');
                    sound.play(notificationSound);
                    clearInterval(timer);
                });
            }
        }).catch((err) => {
            console.log("Error Url: " + err.config.url + " Error Msg: " + err.message);
        });
        
    }
}
