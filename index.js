var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./google-sheets-token.json');
const { promisify } = require('util');

// Create a document object using the ID of the spreadsheet - obtained from its URL.
const SPREADSHEET_ID = '1rvWot0ZcBJVs-z9QU32snG4SyIMwhyC4oSXYMHP73VI';
const SPREADSHEET_TITLE = 'Test data'
var data = 0
var feature = 'MVP feature 1'


/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!')
  app.on('issue_comment.created', async context => {
    // `context` extracts information from the event, which can be passed to
    // GitHub API calls. This will return:
    //   { owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World! }

    if (context.payload.comment.user.type === 'Bot') {
      return
    } else {
      const tracking_issue_number = 5
      const payload = context.payload
      const regex = /(project status: :[^:\s]*(?:::[^:\s]*)*:)/i

      if (payload.issue.number === tracking_issue_number && payload.issue.user.type != "Bot" && payload.comment.body.match(regex)) {
        const status_emoji = payload.comment.body.match(regex)[1].split(' ')[2]
        var emoji = require('node-emoji')
        app.log(emoji.emojify(status_emoji))
        accessSpreadsheet(emoji.emojify(status_emoji))

        // Post a comment on the issue
        // return context.github.issues.createComment(params)
      } else {
        app.log("Oh no")
      }

      app.log("Logging app!")
    }
  })
}

async function accessSpreadsheet(status_emoji) {
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID)
  await promisify(doc.useServiceAccountAuth)(creds)
  const info = await promisify(doc.getInfo)()
  console.log(`Loaded doc: ` + info.title + ` by ` + info.author.email)
  const sheet = info.worksheets.find(o => o.title === SPREADSHEET_TITLE)

  const cells = await promisify(sheet.getCells)({
      'min-row': 1,
      'max-row': sheet.rowCount,
      'min-col': 1,
      'max-col': sheet.colCount,
      'return-empty': true,
  })

  for (const cell of cells) {
      if (cell.value === feature) {
        data = cells.indexOf(cell)
      }
  }

  updateNextEmptyStatusCell(cells, data, status_emoji)

}

async function updateNextEmptyStatusCell(cells, data, status_emoji){
  do {
    data++
  }
  while (cells[data].value)

  var cell = cells[data];
  cell.value = status_emoji;
  await cell.save(); //async
}
