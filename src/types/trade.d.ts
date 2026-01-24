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


type TradePlayerSuggestionReturnType = { playerId: string; firstname: string | null; lastname: string | null; salary: number }
declare interface TradeSuggestion {
  outgoing: Array<TradePlayerSuggestionReturnType>
  incoming: Array<TradePlayerSuggestionReturnType>
  preview : TradePreview
}
