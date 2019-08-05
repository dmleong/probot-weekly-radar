// Set up auth for Google spreadsheet
var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./google-sheets-token.json');
const { promisify } = require('util');

// Create a document object using the ID of the spreadsheet - obtained from its URL.
const SPREADSHEET_ID = '1rvWot0ZcBJVs-z9QU32snG4SyIMwhyC4oSXYMHP73VI';
const SPREADSHEET_TITLE = 'Test data'
var data = 0
var feature = 'MVP feature 2'

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!')
  app.on('issues.opened', async context => {
    const payload = context.payload

    if (payload.issue.user.login != 'dmleong') {
      return
    } else {
      // Post a comment on the issue
      const params = context.issue({ body: 'Stardust update\r\n- [ ] ♻️ All good \r\n- [ ] ⚠️ Behind schedule \r\n- [ ] 🔥 Blocked and in danger' })
      return context.github.issues.createComment(params)

      app.log("Logging app!")
    }
  })

  app.on('issue_comment.edited', async context => {
    const regex = /(\-\s\[x\]\s.)/i
    app.log(context.payload.comment.body)

    //Todo: check if issue comment edit was only the status emoji
    //and do some validation to match it to the right date/column
    const status_emoji = context.payload.comment.body.match(regex)[1].split(' ')[2]
    // unicode_status = '\\u' + status_emoji.charCodeAt(0).toString(16)
    // TODO: fix emoji encoding
    accessSpreadsheet(status_emoji)
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
  while (cells[data].value)

  var cell = cells[data];
  cell.value = status_emoji;
  // Update spreadsheet
  await cell.save();
}
