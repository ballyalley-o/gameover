import axios from 'axios'
import { SPORTSDATA_DIR, sportsdataHeaders } from 'config/dir/sportsdata'
import type { TeamAbbrNBA } from 'constant'

const _axiosGET = async (url: string) => {
  const res = await axios.get(url, { headers: sportsdataHeaders() })
  return res
}

export const feedService = {
  // Player
  async getPlayerByPlayerId(playerId: string) {
    const url      = SPORTSDATA_DIR.PLAYER_BY_PLAYERID(playerId)
    const { data } = await _axiosGET(url)
    return data
  },

  async getPlayerActiveAll() {
    const url      = SPORTSDATA_DIR.PLAYERS_ACTIVE
    const { data } = await _axiosGET(url)
    return data
  },

  async getPlayerDetailAll() {
    const url      = SPORTSDATA_DIR.PLAYER_DETAILS
    const { data } = await _axiosGET(url)
    return data
  },

  async getPlayerInjuredAll() {
    const url      = SPORTSDATA_DIR.INJURED_PLAYERS
    const { data } = await _axiosGET(url)
    return data
  },

  async getPlayerAllByTeam(team: TeamAbbrNBA) {
    const url      = SPORTSDATA_DIR.PLAYERS_BY_TEAM(team)
    const { data } = await _axiosGET(url)
    return data
  },

  // Team
  async getTeamAll() {
    const url      = SPORTSDATA_DIR.TEAM_ALL
    const { data } = await _axiosGET(url)
    return data
  },

  async getTeamActiveAll() {
    const url      = SPORTSDATA_DIR.TEAM_ACTIVE
    const { data } = await _axiosGET(url)
    return data
  },

  async getPlayerAllProfilesByTeam(team: TeamAbbrNBA) {
    const url      = SPORTSDATA_DIR.PLAYERS_PROFILES_BY_TEAM(team)
    const { data } = await _axiosGET(url)
    return data
  },

  // Score
  async getScoreAllByDate(date: string) {
    const url      = SPORTSDATA_DIR.SCORES_BASIC_BY_DATE(date)
    const { data } = await _axiosGET(url)
    return data
  },

  async getScoreAllByDateFinal(date: string) {
    const url      = SPORTSDATA_DIR.SCORES_BASIC_BY_DATE_FINAL(date)
    const { data } = await _axiosGET(url)
    return data
  },

  async getAllStarAll(season: string) {
    const url      = SPORTSDATA_DIR.ALL_STARS(season ?? new Date().getFullYear())
    const { data } = await _axiosGET(url)
    return data
  },

  // Boxscore
  async getBoxscoreAllByDateFinal(date: string) {
    const url      = SPORTSDATA_DIR.BOXSCORES_BY_DATE_FINAL(date)
    const { data } = await _axiosGET(url)
    return data
  },

  // Stats
  async getPlayerStatsBySeasonAndPlayerId(season: string, playerId: string) {
    const url      = SPORTSDATA_DIR.PLAYER_SEASONSTATS_BY_PLAYER(season, playerId)
    const { data } = await _axiosGET(url)
    return data
  },

  async getScheduleAll(season: string) {
    const url      = SPORTSDATA_DIR.SCHEDULES(season)
    const { data } = await _axiosGET(url)
    return data
  },

  async getStanding(season: string) {
    const url      = SPORTSDATA_DIR.STANDING(season)
    const { data } = await _axiosGET(url)
    return data
  },

  async getNewsAll() {
    const url      = SPORTSDATA_DIR.NEWS
    const { data } = await _axiosGET(url)
    return data
  },
  /**
   * Fetch NBA free agents from SportsData.io.
   * Returns the API payload directly.
   */
  async getFreeAgents() {
    const url      = SPORTSDATA_DIR.PLAYERS_FREEAGENTS
    const { data } = await _axiosGET(url)
    return data
  }
}
