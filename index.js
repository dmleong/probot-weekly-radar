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
      // const params = context.issue({ body: 'Hello World!' })

      if (payload.issue.number === tracking_issue_number && payload.issue.user.type != "Bot" && payload.comment.body.match(regex)) {
        const status_emoji = payload.comment.body.match(regex)[1].split(' ')[2]
        var emoji = require('node-emoji')
        app.log(emoji.emojify(status_emoji))
        
        // Post a comment on the issue
        // return context.github.issues.createComment(params)
      } else {
        app.log("Oh no")
      }

      app.log("Logging app!")
    }
  })
}


// "body": "- Project Status: :recycle: \r\n- Projected Ship Date: Nov 2019\r\n- Next Major Deliverable\r\n  - Description: getting front end talking to Go backend instead of dotcom GraphQL API\r\n  - Delivery Date: :calendar: Aug 2\r\n- What Happened This Week\r\n  - Markdown formatting\r\n  - Link formatting for GitHub links\r\n  - Storybook works in dev again\r\n  - Emoji support exploration\r\n- What We're Planning Next Week\r\n  - Pagination"
