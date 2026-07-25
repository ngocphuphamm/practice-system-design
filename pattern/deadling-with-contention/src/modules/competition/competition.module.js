const { CompetitionController } = require('./competition.controller');
const { CompetitionService } = require('./competition.service');

/**
 * Competition Module for handling race condition APIs
 */
class CompetitionModule {
  static createController(competitionService) {
    return new CompetitionController(competitionService);
  }

  static createService(lockManager) {
    return new CompetitionService(lockManager);
  }
}

module.exports = { CompetitionModule };