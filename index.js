// Set up auth for Google spreadsheet
var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./google-sheets-token.json');
const { promisify } = require('util');

// Create a document object using the ID of the spreadsheet - obtained from its URL.
const SPREADSHEET_ID = '1rvWot0ZcBJVs-z9QU32snG4SyIMwhyC4oSXYMHP73VI';
const SPREADSHEET_TITLE = 'Test data'
var data = 0
// Todo: grab by the tracking URL instead
var feature = 'MVP feature 2'
var status_colors = {
  'green': ['♻', 9851, '267B'],
  'yellow': ['⚠', 9888, '26A0'],
  'red': ['🛑', 55357, '1F6D1'],
  'black': ['🚢', 128755, 'd83d'],
  'grey': ['⏸', 9208, '23f8']
}

const emojiUnicode = require("emoji-unicode")
const toEmoji = require("emoji-name-map")

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.log('Yay, the app was loaded!')
  app.on('issue_comment.edited', async context => {
    const regex = /(\-\s\[x\]\s.)/i
    app.log(context.payload.comment.body)
    var comment_body = context.payload.comment.body

    //Todo: check if issue comment edit was only the status emoji
    //and check if nothing is checked
    if (comment_body.match(regex)) {
      var status_emoji = context.payload.comment.body.match(regex)[1].split(' ')[2]
      app.log(emojiUnicode(status_emoji))

      for (let obj in status_colors) {
        console.log(status_colors[obj])
        if (status_colors[obj].includes(status_emoji)) {
          accessSpreadsheet(obj)
          app.log("Success!" + obj)
        }
      }

    } else {
      app.log("No status")
    }
  })
}

async function accessSpreadsheet(status_emoji) {
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
      if (cell.value === feature) {
        data = cells.indexOf(cell)
      }
  }

  updateNextEmptyStatusCell(cells, data, status_emoji)
}

// Update the next empty cell with the status from the GitHub comment
async function updateNextEmptyStatusCell(cells, data, status_emoji){
  do {
    data++
  }
  // TODO: Validate the date to only update the relevant status for the week
  while (cells[data].value)

  var cell = cells[data];
  cell.value = status_emoji;
  // Update spreadsheet
  await cell.save();
}
