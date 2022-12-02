"use strict"

require('dotenv').config();
const { Octokit } = require("@octokit/rest");
const cron = require('node-cron');
const nodemailer = require("nodemailer");
const moment = require("moment");

const octokit = new Octokit({ 
    auth: process.env.GH_KEY,
    
});

var commitDate = ""; 
var currentLocaleDate ="";

async function getCommitsByDay() {
    const { data } = await octokit.rest.repos.listCommits({
        repo: "Learning-and-Projects",
        owner: "adamak93"
    });
    currentLocaleDate = (new Date().toLocaleString("sv", {timeZone: "America/Toronto"})).slice(0,10);
    commitDate = (data[0].commit.author.date).slice(0,10);
};


const fromEmail = process.env.FROM_EMAIL;
const toEmail =  process.env.TO_EMAIL;

const mailNoCommitOptions = {
    from: fromEmail,
    to: toEmail,
    subject: 'Git Repo Status Alert' ,
    text: 'Hello! We are writing to inform you that you have not submitted a Git commit to the Learning and Projects repository in the last 24 hours. Do better.',
};

const mailCommitOptions = {
    from: fromEmail,
    to: toEmail,
    subject: 'Git Repo Status Alert' ,
    text: 'Hello! We are writing to inform you that a Git commit has been submitted to the Learning and Projects repository in the last 24 hours. Keep up the great work!!',
};

const transporter = nodemailer.createTransport({
    host:"smtp-mail.outlook.com",
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, 
    tls: {
       ciphers:'SSLv3'
    },
    auth: {
        user: fromEmail,
        pass: process.env.FROM_PASSWORD
    }
});

cron.schedule('59 23 * * 1-5 ', () => {
    getCommitsByDay();
    if (commitDate == currentLocaleDate) {
        transporter.sendMail(mailCommitOptions, (error, info) => {
            if(error) {
                console.log(error);
            } else {
                console.log('Email send: ' + info.response);
            }
        });
    } else {
        transporter.sendMail(mailNoCommitOptions, (error, info) => {
            if(error) {
                console.log(error);
            } else {
                console.log('Email send: ' + info.response);
            }
        });
    }
    }, {
    scheduled: true,
    timezone: "America/Toronto"
  });