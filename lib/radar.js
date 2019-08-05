module.exports = class Radar {
  constructor(github, config) {
    this.github = github;
    this.config = Object.assign({}, require('./defaults'), config || {});
    this.logger = config.logger || console;
  }

  async getConfig(){
    return this.config;
  }
  //return most recent issues with select labels
  async getIssuesWithLabel(){
    const {owner, repo, labels} = this.config;
    this.logger.debug(owner, repo, labels);
    var all_issues = {};

    await Promise.all(labels.map( async (label) => {
      var query = `repo:${owner}/${repo} is:issue is:open label:${label} `;
      const params = {
        q: query,
        sort: 'updated',
        order: 'desc',
        per_page: 100
      };

      var issues = await this.github.search.issues(params);
      if(!all_issues[label]){
        all_issues[label] = issues.items;
      }else{
        all_issues[label] = all_issues[label].concat(issues.items);
      }
    }));

    return all_issues;
  }

  async generateRadarIssueBody(data){
    const {owner, radar} = this.config;
    var issue_body = '## Here is the radar for the week\n'
    await Promise.all(Object.keys(data).map(async (label) =>{
      issue_body += `### ${label}\n`;
      issue_body += data[label].map( issue => {
        return `[${issue.title}](${issue.html_url})\n`;
      });
    }));
    return issue_body;
  }

  // Create radar issue with issue titles links
  async createRadarIssue(issue_body){
    // Check if we need to create an issue
    //TODO  isRadarIssueOpen
    const {owner, radar} = this.config;
    var repo = radar.repo;
    var radar_labels = radar.labels;
    return this.github.issues.create({
      owner: owner,
      repo: repo,
      title: 'Radar for the week',
      labels: radar_labels,
      body: issue_body
    });
  }

  // Close a radar issue if it's open for more than x days
  async closeRadarIssue(){
    //TODO
    return;
  }

  //check if there is an open radar issue in the radar repo
  async isRadarIssueOpen(){
    const {owner, radar} = this.config;

    // Get all radar labels
    var radar_labels = radar.labels.join(' label:')
    this.logger.debug('radar_labels: ', radar_labels)

    // Check if the radar issue has an open radar label issue
    var query = `repo:${owner}/${radar.repo} is:issue is:open label:${radar_labels} `
    const params = {
      q: query,
      sort: 'updated',
      order: 'desc',
      per_page: 1
    };

    var radar_issues = await this.github.search.issues(params);
    if(radar_issues.total_count >= 1){
      this.logger.info('Found atleast 1 open radar open issue');
      return true;
    }
    return false;
  }
};
