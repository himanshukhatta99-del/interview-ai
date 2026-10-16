const mongoose = require('mongoose')

const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [ true, "token is required to be added in blacklist" ],
        index: true
    }
}, {
    timestamps: true
})

// TTL index: MongoDB deletes each blacklisted token 1 day after it was added.
// Login tokens expire after 1 day anyway, so keeping them longer is pointless
// and the collection would otherwise grow forever.
blacklistTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 })

const tokenBlacklistModel = mongoose.model("blacklistTokens", blacklistTokenSchema)

module.exports = tokenBlacklistModel
