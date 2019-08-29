// Set up auth for Google spreadsheet
var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./google-sheets-token.json');
const { promisify } = require('util');

// Create a document object using the ID of the spreadsheet - obtained from its URL.
const SPREADSHEET_ID = '1feRnLYA4KYoe6NLtg50w3e33rYZpCJtS5cYhIo-YH38';
const SPREADSHEET_TITLE = 'Week-by-Week: Initiative Status'
var data = 0
// Todo: grab by the tracking URL instead
var feature = 'MVP feature 2'
var status_colors = {
  'green': ':recycle:',
  'yellow': ':warning:',
  'red': ':x:',
  'black': ':ship:',
  'grey': ':pause_button:'
}

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.log('Yay, the app was loaded!')
  app.on('issue_comment.edited', async context => {
    const regex = /(\-\s\[x\]\s.(.*?)\:)/i
    app.log(context.payload.comment.body)
    var comment_body = context.payload.comment.body
    var url = context.payload.issue.html_url
    var key = ""

    if (comment_body.match(regex)) {
      var status = context.payload.comment.body.match(regex)[1].split(' ')[2]
      key = Object.keys(status_colors).filter(function(key) {return status_colors[key] === status})[0];
    }
    accessSpreadsheet(key, url)
  })
}

async function accessSpreadsheet(status, url) {
  // Get the Google spreadsheet
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID)
  await promisify(doc.useServiceAccountAuth)(creds)
  const info = await promisify(doc.getInfo)()
  const sheet = info.worksheets.find(o => o.title === SPREADSHEET_TITLE)

  // Find cells we want to update.
  // We have to grab by range of cells in order to access
  // empty cells
  const cells = await promisify(sheet.getCells)({
      'min-row': 1,
      'max-row': sheet.rowCount,
      'min-col': 1,
      'max-col': sheet.colCount,
      'return-empty': true,
  })

  // Find the feature we want to update
  for (const cell of cells) {
      if (cell.value === url) {
        data = cells.indexOf(cell)
      }
  }

  updateStatusCell(cells, data, status)
}

// Update the next empty cell with the status from the GitHub comment
async function updateStatusCell(cells, data, status){
  do {
    data++
  }

  // Get the last empty cell in the range
  while (cells[data].value)
  var cell = cells[data];
  status.charAt(0).toUpperCase() + status.slice(1)

  // Check if the date range is within the right week for status update
  var today = new Date();
  var status_due_date = new Date(cells[cell.col-1].value)
  status_due_date.setYear(2019)

  // Update spreadsheet
  if (status === "") {
    // Clear status if status is empty
    cell = cells[data-1]
    cell.value = ""
    await cell.save()
  } else if (checkDate(status_due_date - today)){
    // Check if within the right time frame
    cell.value = status
    await cell.save()
  } else {
    console.log("Do not update")
  }
}

//Todo: Clean up logic
function checkDate( milliseconds ) {
    var day, hour, minute, seconds;
    seconds = Math.floor(milliseconds / 1000);
    minute = Math.floor(seconds / 60);
    seconds = seconds % 60;
    hour = Math.floor(minute / 60);
    minute = minute % 60;
    day = Math.floor(hour / 24);
    hour = hour % 24;

    // Only return true if within the same week as
    // the due date
    if (day > 6) {
      return false
    } else if (day >= 0 && hour < 24) {
      return true
    } else {
      return false
    }
}
