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

    //Todo: check if issue comment edit was only the status emoji
    //and check if nothing is checked
    //and add error validations
    if (comment_body.match(regex)) {
      var status = context.payload.comment.body.match(regex)[1].split(' ')[2]

      var key = Object.keys(status_colors).filter(function(key) {return status_colors[key] === status})[0];
      accessSpreadsheet(key, url)

    } else {
      app.log("No status")
    }
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

  updateNextEmptyStatusCell(cells, data, status)
}

// Update the next empty cell with the status from the GitHub comment
async function updateNextEmptyStatusCell(cells, data, status){
  do {
    data++
  }
  // TODO: Validate the date to only update the relevant status for the week
  // TODO: Clear cell if empty value is passed
  while (cells[data].value)
  if (status) {
    status.charAt(0).toUpperCase() + status.slice(1)

    var cell = cells[data];
    //TODO: get the validated cell value instead of putting in the status word
    cell.value = status;
    // Update spreadsheet
    await cell.save();
  }
}
