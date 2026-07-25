/**
 * Competition Controller for handling race condition APIs
 */
class CompetitionController {
  constructor(competitionService) {
    this.competitionService = competitionService;
  }

  /**
   * Handle competition API requests
   * @param {Object} request - HTTP request object 
   * @param {Object} response - HTTP response object
   * @returns {Promise<void>}
   */
  async handleRequest(request, response) {
    const compMatch = request.url.match(/^\/competition\/(\w+)$/);

    if (!compMatch) {
      response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Route not found' }));
      return;
    }

    try {
      const compType = compMatch[1];

      if (request.method !== 'POST') {
        response.writeHead(405, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      let body = '';
      request.on('data', (chunk) => { body += chunk; });
      request.on('end', async () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          
          if (!payload.competitionId) {
            response.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify({ error: 'competitionId is required' }));
            return;
          }

          const result = await this.competitionService.handleCompetition(
            compType,
            payload.competitionId,
            payload.data || {}
          );

          response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
          response.end(JSON.stringify(result));
        } catch (error) {
          if (error.code === 'LOCK_MANAGER_NOT_CONFIGURED') {
            response.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify({ error: error.message }));
          } else if (error.code === 'COMPETITION_LOCK_FAILED') {
            response.writeHead(409, { 'content-type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify({ error: error.message }));
          } else {
            console.error(error);
            response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify({ error: 'Internal server error' }));
          }
        }
      });
    } catch (error) {
      console.error(error);
      response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
}

module.exports = { CompetitionController };