import { Router } from 'express'
import { FeedController } from 'controller/feed'
import { protect } from 'middleware'

const router = Router({ mergeParams: true })

router.get('/player', protect, FeedController.getPlayerByPlayerId)
router.get('/player-active-all', protect, FeedController.getPlayerActiveAll)
router.get('/player-detail-all', protect, FeedController.getPlayerDetailAll)
router.get('/player-injured-all', protect, FeedController.getInjuredPlayerAll)
router.get('/player-all-by-team', protect, FeedController.getPlayerAllByTeam)
router.get('/player-all-profiles-by-team', protect, FeedController.getPlayerAllProfilesByTeam)
router.get('/player-stats', protect, FeedController.getPlayerStatsBySeasonAndPlayerId)

router.get('/team-all', protect, FeedController.getTeamAll)
router.get('/team-active-all', protect, FeedController.getTeamActiveAll)

router.get('/score-all-by-date', protect, FeedController.getScoreAllByDate)
router.get('/score-all-by-date-final', protect, FeedController.getScoreAllByDateFinal)

router.get('/boxscore-all-by-date-final', protect, FeedController.getBoxscoreAllByDateFinal)

router.get('/allstar-all', protect, FeedController.getAllStarAll)
router.get('/schedule', protect, FeedController.getScheduleAll)
router.get('/standing', protect, FeedController.getStanding)
router.get('/news', protect, FeedController.getNewsAll)
router.get('/freeagent', protect, FeedController.getFreeAgents)


/**
 * @path {apiURL}/feed/sportsdata
 */
export default router
