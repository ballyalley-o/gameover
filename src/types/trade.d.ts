declare type ExceptionType = 'trade_exception' | 'mid_level' | 'bi_annual'
declare interface TradePayload {
  fromTeamId : string
  toTeamId   : string
  outgoingIds: string[]
  incomingIds: string[]
}

type TradeTeamPreviewType = {
    outgoing       : number
    incoming       : number
    allowedIncoming: number
    postSalary     : number
    cap            : number
    exceptionBudget: number
    exceptionUsed  : number
}

declare interface TradePreview {
  valid  : boolean
  reason?: string
  from   : TradeTeamPreviewType
  to     : TradeTeamPreviewType
}

declare interface TradeSuggestionPayload {
  fromTeamId     : string
  toTeamId       : string
  maxSuggestions?: number
}

declare interface TradeHistoryFilterTypes {
  teamId?: string
  limit ?: number
  offset?: number
}

declare interface TradeHistoryItemType {
  id               : string
  fromTeamId       : string
  toTeamId         : string
  outgoingIds      : string[]
  incomingIds      : string[]
  outgoingSalary   : number
  incomingSalary   : number
  fromExceptionUsed: number
  toExceptionUsed  : number
  status           : string
  createdAt        : Date
}


type TradePlayerSuggestionReturnType = { playerId: string; firstname: string | null; lastname: string | null; salary: number }
declare interface TradeSuggestion {
  outgoing: Array<TradePlayerSuggestionReturnType>
  incoming: Array<TradePlayerSuggestionReturnType>
  preview : TradePreview
}
