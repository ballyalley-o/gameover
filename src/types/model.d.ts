declare global {
    namespace Mongoose {
       interface Schema {
         Types: {
           ObjectId: any
         }
       }
    }
}

declare type IndexType<T extends Record<string, number>> = {
    [K in typeof T]: IndexDirection }

declare type Role = 'user' | 'admin'

declare type PasswordStrengthType = 'weak' | 'medium' | 'strong'