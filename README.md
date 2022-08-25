# sipgate.io calendar SMS notification example
In this project we'll be using our [sipgate.io Rest-API](https://www.sipgate.io/en/rest-api) to send an SMS notification for upcoming Google Calendar events using [Google Apps Scripts](https://developers.google.com/apps-script).

For further information regarding the sipgate REST API please visit https://api.sipgate.com/v2/doc

- sipgate.io calendar SMS notication example
    - [Introduction](#introduction)
    - [Prerequisites](#prerequisites)
    - [Configuration](#configuration)
        - [Daily trigger](#daily-trigger)
    - [How To Use](#how-to-use)
        - [Adding contacts](#adding-contacts)
        - [Creating calendar events](#creating-calendar-events)
    - [How It Works](#how-it-works)
    - [Common Issues](#common-issues)
        - [Google can't find a phone number assigned to the contact](#google-cant-find-a-phone-number-assigned-to-the-contact)
        - [HTTP Errors](#http-errors)
    - [Contact Us](#contact-us)
    - [External Libraries](#external-libraries)

    


## Introduction
This project can notify your [Google Contacts](https://contacts.google.com/) that are invited to Google Calendar events. This is done by sending an SMS to the phone number specified for the participating Google Contact. Please note that each guest invited to the event must exist as a Google Contact in order to read the phone number.

## Prerequisites
Install [clasp](https://github.com/google/clasp):
```console
npm install -g clasp
```
This enables you to develop Google Apps Script projects locally.

Initially, you will need to log in using `clasp login` to authenticate your Google account.

Afterwards, you will be able to create a new Google Apps Scripts project using `
clasp create --title SMS-Notification-Service
`. If you now navigate to [script.google.com](https://script.google.com/home), you will find your newly created project.

By running `clasp push -w` you can continuously push your locally written code to the online IDE.

## Configuration
Before running the project, we will need to set up the sipgate token properties as script properties in the Google project space.

Navigate to your project settings in the online IDE, add your `token` and `tokenID` script properties and fill them in appropriately.

The token should have the `session:sms:write` scope. For more information about personal access tokens visit our [website](https://www.sipgate.io/en/rest-api/authentication#personalAccessToken).

Run the function `smsNotificationService` using the online IDE. During your first execution, the script should automatically generate a new calendar called `SmsNotification`. This is the calendar from which we will fetch upcoming events and notify the recipients.

### Daily trigger
Ideally, the script should function automatically each day. In order to achieve this, Google provides [triggers](https://developers.google.com/apps-script/guides/triggers/installable) you can specify to do just that.

In order to create a new trigger, go to the triggers tab in your online IDE and click on "Add Trigger". From the menu, set the event source to "timed" and specify a Day timer set a timeframe of your liking.

Upon saving, your script should now execute automatically everyday during that timeframe!

## How To Use

### Adding contacts
In order to add a contact the script can use to send SMS notifications, navigate to the [Google Contacts app](https://contacts.google.com/). Here, you will want to add contacts and their related email addressses and mobile numbers. As mentioned in [limitations](#limitations), the contact will only be relevant to the script if they have a email address and a phone number tagged with the "Mobile" label.

### Creating calendar events
If you followed the configuration section, the script should have run at least once and created the `SmsNotification` calendar. You are now free to add events to it and assign the relevant contacts. Each recipient should now receive an SMS notification a day prior to the event, during the timeframe configured in the trigger!

## How It Works
In our main function `smsNotificationService`, we first check for the existence of a calendar with the given name `SmsNotification`. This is done using the Google Calendar App integration for Google Apps Script. If the calendar does not yet exist, the script creates it for us.
```js
function smsNotificationService() {
  const name = "SmsNotification";

  if(!calendarExists(name)) {
    CalendarApp.createCalendar(name, {summary : 'All events in this calendar will send a sms notification'});
    console.log(`Created new calendar ${name}`);
  }
  
  ...

}

function calendarExists(name) {
  const calendars = CalendarApp.getCalendarsByName(name);
  return calendars.length > 0;
}
```

Afterwards, the script checks for calendar events for the next day in the given calendar using the `calendar.getEventsForDay()` function. From here on we can loop over each event and get the event information using the following function:
```js
function getEventInformation(event) {
  const emails = event.getGuests();
  const guests = emails.map(mail => ContactsApp.getContact(mail));
  return {
    dateTime: event.getStartTime(),
    recipients: guests
  };
}
```
The function uses the Contacts App integration for Google Apps Script to fetch the contact. We use this to loop over all recipients for the related event and try to fetch their phone numbers, ultimately filtering for a phone number with the label `MOBILE_PHONE`.
```js
const eventInformation = getEventInformation(event);

eventInformation.recipients.forEach(recipient => {
    const phones = recipient.getPhones();

    const mobilePhoneField = phones.find(x => x.getLabel().name() == 'MOBILE_PHONE');

    if (mobilePhoneField) {
        sendSMS(eventInformation.dateTime, mobilePhoneField.getPhoneNumber())
    }
});
```
If that phone number exists, we are ready to send out an SMS notification using sipgate.io! This is done by simply sending an HTTP POST request to the REST API:
```js
function sendSMS(dateTime, phoneNumber) {
  const date = dateTime.toLocaleDateString("de-DE");
  const time = dateTime.toLocaleTimeString("de-DE").substring(0, 5);
  const message = `Bitte denken Sie an Ihren Termin am ${date} um ${time} Uhr.`;
  
  const options = {
    'method' : 'post',
    'contentType' : 'application/json',
    'payload' : `{ "smsId": "s0", "recipient": "${phoneNumber.replace(/ /g, "")}", "message": "${message}" }`,
    'headers' : {
      'Authorization' : `Basic ${getBase64Token()}`
    },
  };
  const response = UrlFetchApp.fetch('https://api.sipgate.com/v2/sessions/sms', options);
  console.log(`Sent a reminder SMS to ${phoneNumber}`);
}
```

## Common Issues
### Google can't find a phone number assigned to the contact
This is most likely due to a recipient not being added as a custom Google Contact, but via other sources which don't enable the addition of a mobile phone number.

### HTTP Errors
| reason | errorcode |
| -- | :--: |
| bad request (e.g. request body fields are empty or only contain spaces, etc.) | 400 | 
| tokenId and/or token are wrong | 401 | 
| your account balance is insufficient | 402 | 
| internal server error or unhandled bad request | 500 | 

## Contact Us
Please let us know how we can improve this example. If you have a specific feature request or found a bug, please use Issues or fork this repository and send a **pull request** with your improvements.

## External Libraries
- clasp:
    - Licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)  
    - Website: https://github.com/google/clasp

[sipgate.io](https://www.sipgate.io) | [@sipgateio](https://twitter.com/sipgateio) | [API-doc](https://api.sipgate.com/v2/doc)