function smsNotificationService() {
  const name = "SmsNotification";

  if(!calendarExists(name)) {
    CalendarApp.createCalendar(name, {summary : 'All events in this calendar will send a sms notification'});
  }

  const calendars = CalendarApp.getCalendarsByName(name);
  const calendar = calendars[0];
  const events = getEventsNextDay(calendar);
  events.forEach((event) => {
      const eventInformation = getEventInformation(event);
      eventInformation.recipients.forEach(recipient => {
        recipient && sendSMS(eventInformation.dateTime, recipient.getMobilePhone())
      });
  });
}

function calendarExists(name) {
  const calendars = CalendarApp.getCalendarsByName(name);
  return calendars.length > 0;
}

function getEventsNextDay(calendar) {
  const tomorrow  = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return calendar.getEventsForDay(tomorrow);
}

function getEventInformation(event) {
  const emails = event.getGuests();
  const guests = emails.map(mail => ContactsApp.getContact(mail));
  return {
    dateTime: event.getStartTime(),
    recipients: guests
  };
}

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
  UrlFetchApp.fetch('https://api.sipgate.com/v2/sessions/sms', options);
}

function getBase64Token() {
  const properties = PropertiesService.getScriptProperties();
  const tokenID = properties.getProperty("tokenID");
  const token = properties.getProperty("token");
  const base64Token = Utilities.base64Encode(Utilities.newBlob(`${tokenID}:${token}`).getBytes());
  return base64Token;
}