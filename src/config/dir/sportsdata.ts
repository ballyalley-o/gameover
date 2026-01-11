import { GLOBAL } from 'config/global'
import { SSM_GET } from 'config/ssm.global'
import type { TeamAbbrNBA } from 'constant'
import { combineURL } from 'utility'

const API_URL    = GLOBAL.SPORTSDATA_URL ?? ''
const API_KEY    = await SSM_GET.SPORTSDATA_APIKEY || ''
const API_HEADER = await SSM_GET.SPORTSDATA_AUTH_HEADER || ''

const _LEAGUE_NBA = 'nba'

const _MODULE_SCORES      = 'scores'
const _MODULE_STATS       = 'stats'
const _MODULE_PROJECTIONS = 'projections'
const _MODULE_HEADSHOTS   = 'headshots'

const _FORMAT_JSON   = 'json'

const _ALL_STARS                      = 'allstars'
const _BOXSCORE                       = 'boxscore'
const _BOXSCORES                      = 'boxscores'
const _BOXSCORES_DELTA                = 'boxscoresdelta'
const _BOXSCORE_FINAL                 = 'boxscorefinal'
const _BOXSCORES_FINAL                = 'boxscoresfinal'
const _DEPTH_CHARTS                   = 'depthcharts'
const _FREEAGENTS                     = 'freeagents'
const _INJURED_PLAYERS                = 'injuredplayers'
const _STANDINGS                      = 'standings'
const _STADIUMS                       = 'stadiums'
const _TEAMS                          = 'teams'
const _TEAM_SEASONSTATS               = 'teamseasonstats'
const _TEAM_STATS_ALLOWED_BY_POSITION = 'teamstatsallowedbyposition'
const _TEAM_GAMESTATS_BY_SEASON       = 'teamgamestatsbyseason'
const _TEAM_GAMESTATS_BY_DATE_FINAL   = 'teamgamestatsbydate'
const _ALL_TEAMS                      = 'allteams'
const _SCHEDULES_BASIC                = 'schedulesbasic'
const _SCORES_BASIC                   = 'scoresbasic'
const _SCORES_BASIC_FINAL             = 'scoresbasicfinal'
const _GAMES_BY_DATE                  = 'gamesbydate'
const _GAMES_BY_DATE_FINAL            = 'gamesbydatefinal'
const _NEWS                           = 'news'
const _NEWS_BY_DATE                   = 'newsbydate'
const _NEWS_BY_PLAYERID               = 'newsbyplayerid'

const _PLAY_BY_PLAY_BY_GAMEID_FINAL   = 'playbyplayfinal'
const _PLAY_BY_PLAY_DELTA_BY_DATE     = 'playbyplaydelta'
const _PLAY_BY_PLAY_BY_GAMEID         = 'playbyplay'

const _PLAYERS                        = 'players'
const _PLAYERS_BY_FREEAGENTS          = 'playersbyfreeagents'
const _PLAYERS_BASIC                  = 'playersbasic'
const _PLAYERS_ACTIVE_BASIC           = 'playersactivebasic'
const _PLAYERS_SEASONSTATS            = 'playerseasonstats'
const _PLAYERS_SEASONSTATS_BY_TEAM    = 'playerseasonstatsbyteam'
const _PLAYER_SEASONSTATS_BY_PLAYER   = 'playerseasonstatsbyplayer'
const _PLAYER_GAMESTATS_BY_SEASON     = 'playergamestatsbyseason'
const _PLAYER_GAMESTATS_BY_DATE       = 'playergamestatsbydate'
const _PLAYER_GAMESTATS_BY_DATE_FINAL = 'playergamestatsbydatefinal'
const _STARTING_LINEUPS_BY_DATE       = 'startinglineupsbydate'
const _TRANSACTIONS_BY_DATE           = 'transactionsbydate'

const _combineNBAScores = (...parts: string[]) => {
  return combineURL(API_URL, _LEAGUE_NBA, _MODULE_SCORES, _FORMAT_JSON, ...parts)
}

const _combineNBAStats = (...parts: string[]) => {
  return combineURL(API_URL, _LEAGUE_NBA, _MODULE_STATS, _FORMAT_JSON, ...parts)
}

const _combineNBAProjections = (...parts: string[]) => {
  return combineURL(API_URL, _LEAGUE_NBA, _MODULE_PROJECTIONS, _FORMAT_JSON, ...parts)
}

const _combineNBAHeadshots = (...parts: string[]) => {
  return combineURL(API_URL, _LEAGUE_NBA, _MODULE_HEADSHOTS, _FORMAT_JSON, ...parts)
}


export const SPORTSDATA_DIR = {
  ALL_STARS                      : (season: string) => _combineNBAStats(_ALL_STARS, season),
  BOXSCORE_BY_GAMEID_LIVE        : (gameId: string) => _combineNBAStats(_BOXSCORE, gameId),
  BOXSCORES_BY_DATE_LIVE         : (date: string) => _combineNBAStats(_BOXSCORES, date),
  BOXSCORES_DELTA_BY_DATE_LIVE   : (date: string, min: string) => _combineNBAStats(_BOXSCORES_DELTA, date, min),
  BOXSCORE_BY_GAMEID_FINAL       : (gameId: string) => _combineNBAStats(_BOXSCORE_FINAL, gameId),
  BOXSCORES_BY_DATE_FINAL        : (date: string) => _combineNBAStats(_BOXSCORES_FINAL, date),
  DEPTH_CHARTS                   : _combineNBAScores(_DEPTH_CHARTS),
  FREEAGENTS                     : _combineNBAScores(_FREEAGENTS),
  HEADSHOTS                      : _combineNBAHeadshots(_MODULE_HEADSHOTS),
  INJURED_PLAYERS                : _combineNBAProjections(_INJURED_PLAYERS),
  SCORES_BASIC_BY_DATE           : (date: string) => _combineNBAScores(_SCORES_BASIC, date),
  SCORES_BASIC_BY_DATE_FINAL     : (date: string) => _combineNBAScores(_SCORES_BASIC_FINAL, date),
  GAMES_BY_DATE                  : (date: string) => _combineNBAScores(_GAMES_BY_DATE, date),
  GAMES_BY_DATE_FINAL            : (date: string) => _combineNBAScores(_GAMES_BY_DATE_FINAL, date),
  TEAM_ALL                       : _combineNBAScores(_ALL_TEAMS),
  TEAM_ACTIVE                    : _combineNBAScores(_TEAMS),
  TEAM_BY_SEASON                 : (season: string) => _combineNBAScores(_TEAMS, season),
  TEAM_SEASONSTATS               : (season: string) => _combineNBAScores(_TEAM_SEASONSTATS, season),
  TEAM_STATS_ALLOWED_BY_POSITION : (season: string) => _combineNBAScores(_TEAM_STATS_ALLOWED_BY_POSITION, season),
  TEAM_GAMESTATS_BY_SEASON       : (season: string, teamId: string, numOfGames: string = 'all') => _combineNBAScores(_TEAM_GAMESTATS_BY_SEASON, season, teamId, numOfGames),
  TEAM_GAMESTATS_BY_DATE         : (date: string) => _combineNBAScores(_TEAM_GAMESTATS_BY_DATE_FINAL, date),
  TEAM_GAMESTATS_BY_DATE_FINAL   : (date: string) => _combineNBAScores(_TEAM_GAMESTATS_BY_DATE_FINAL, date),
  NEWS                           : _combineNBAScores(_NEWS),
  NEWS_BY_DATE                   : (date: string) => _combineNBAScores(_NEWS_BY_DATE, date),
  NEWS_BY_PLAYERID               : (playerId: string) => _combineNBAScores(_NEWS_BY_PLAYERID, playerId),
  PLAY_BY_PLAY_BY_GAMEID_FINAL   : (gameId: string) => _combineNBAScores(_PLAY_BY_PLAY_BY_GAMEID_FINAL, gameId),
  PLAY_BY_PLAY_BY_GAMEID         : (gameId: string) => _combineNBAScores(_PLAY_BY_PLAY_BY_GAMEID, gameId),
  PLAY_BY_PLAY_DELTA_BY_DATE     : (date: string, min: string) => _combineNBAScores(_PLAY_BY_PLAY_DELTA_BY_DATE, date, min),
  PLAYERS_BASIC                  : (player: string) => _combineNBAScores(_PLAYERS_BASIC, player),
  PLAYER_DETAILS                 : _combineNBAScores(_PLAYERS),
  PLAYERS_FREEAGENTS             : _combineNBAScores(_PLAYERS_BY_FREEAGENTS),
  PLAYERS_ACTIVE                 : _combineNBAScores(_PLAYERS_ACTIVE_BASIC),
  PLAYERS_BY_TEAM                : (team: TeamAbbrNBA) => _combineNBAScores(_PLAYERS, team),
  PLAYERS_SEASONSTATS            : (season: string) => _combineNBAStats(_PLAYERS_SEASONSTATS, season),
  PLAYERS_SEASONSTATS_BY_TEAMABBR: (season: string, teamAbbr: TeamAbbrNBA) => _combineNBAStats(_PLAYERS_SEASONSTATS_BY_TEAM, season, teamAbbr),
  PLAYER_SEASONSTATS_BY_PLAYER   : (season: string, playerId: string) => _combineNBAStats(_PLAYER_SEASONSTATS_BY_PLAYER, season, playerId),
  PLAYER_GAMESTATS_BY_DATE       : (date: string, playerId: string) => _combineNBAStats(_PLAYER_GAMESTATS_BY_DATE, date, playerId),
  PLAYER_GAMESTATS_BY_PLAYER     : (date: string) => _combineNBAStats(_PLAYER_SEASONSTATS_BY_PLAYER, date),
  PLAYER_GAMESTATS_BY_SEASON     : (season: string, playerId: string, numOfGames: string = 'all') => _combineNBAStats(_PLAYER_GAMESTATS_BY_SEASON, season, playerId, numOfGames),
  PLAYERS_GAMESTATS_BY_DATE_FINAL: (date: string) => _combineNBAStats(_PLAYER_GAMESTATS_BY_DATE_FINAL, date),
  STADIUMS                       : _combineNBAScores(_STADIUMS),
  STANDING                       : (season: string) => _combineNBAScores(_STANDINGS, season),
  STARTING_LINEUPS_BY_DATE       : (date: string) => _combineNBAProjections(_STARTING_LINEUPS_BY_DATE, date),
  SCHEDULES                      : (season: string) => _combineNBAScores(_SCHEDULES_BASIC, season),
  TRANSACTIONS                   : (date: string) => _combineNBAScores(_TRANSACTIONS_BY_DATE, date)
}

export const sportsdataHeaders = () => ({
  [API_HEADER]: API_KEY,
})
