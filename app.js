"use strict"

require('dotenv').config();
const { Octokit } = require("@octokit/rest");
const cron = require('node-cron');
const nodemailer = require("nodemailer");
const octokit = new Octokit({ 
    auth: process.env.GH_KEY, 
});

var commitDate = ""; 
var currentLocaleDate ="";

async function getCommitsByDay() {
    const { data } = await octokit.rest.repos.listCommits({
        repo: process.env.GH_REPO,
        owner: process.env.GH_AUTHOR
    });
    currentLocaleDate = (new Date().toLocaleString("sv", {timeZone: "America/Toronto"})).slice(0,10);
    commitDate = (data[0].commit.author.date).slice(0,10);
};

const mailNoCommitOptions = {
    from:  process.env.FROM_EMAIL,
    to: process.env.TO_EMAIL,
    cc: process.env.CC_EMAIL,
    subject: 'Git Repo Status Alert' ,
    text: 'Hello! We are writing to inform you a Git commit has NOT been submitted to the Learning and Projects repository in the last 24 hours.',
};

const transporter = nodemailer.createTransport({
    host:"smtp-mail.outlook.com",
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, 
    tls: {
       ciphers:'SSLv3'
    },
    auth: {
        user: process.env.FROM_EMAIL,
        pass: process.env.FROM_PASSWORD
    }
});

cron.schedule('59 23 * * 1-6 ', () => {
    getCommitsByDay();
    if (currentLocaleDate != commitDate ) {
        console.log("No Commit Detected! Sending failure notification email.")
        transporter.sendMail(mailNoCommitOptions, (error, info) => {
            if(error) {
                console.log(error);
            }
        });
    } else {
        console.log("Commit detected, exiting loop")
    }
}, {
    scheduled: true,
    timezone: "America/Toronto"
  });