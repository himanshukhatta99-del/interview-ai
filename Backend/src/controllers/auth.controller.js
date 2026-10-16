const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")
const { validateRegisterInput, validateLoginInput } = require("../utils/validators")

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Options for the login cookie.
 * - httpOnly: JavaScript in the browser cannot read the token (protects against XSS token theft)
 * - secure:   cookie is only sent over HTTPS (turned on in production)
 * - sameSite: "none" is needed when the frontend and backend are on different domains in production;
 *             "lax" is fine (and safer) for local development.
 */
function getCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production"
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: ONE_DAY_MS
    }
}

function signToken(user) {
    return jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )
}

function toPublicUser(user) {
    return { id: user._id, username: user.username, email: user.email }
}

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {

    const body = req.body ?? {}
    const validationError = validateRegisterInput(body)

    if (validationError) {
        return res.status(400).json({ message: validationError })
    }

    const username = body.username.trim()
    const email = body.email.trim().toLowerCase()
    const { password } = body

    const isUserAlreadyExists = await userModel.findOne({
        $or: [ { username }, { email } ]
    })

    if (isUserAlreadyExists) {
        return res.status(409).json({
            message: "Account already exists with this email address or username"
        })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await userModel.create({
        username,
        email,
        password: hash
    })

    res.cookie("token", signToken(user), getCookieOptions())

    res.status(201).json({
        message: "User registered successfully",
        user: toPublicUser(user)
    })
}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {

    const body = req.body ?? {}
    const validationError = validateLoginInput(body)

    if (validationError) {
        return res.status(400).json({ message: validationError })
    }

    const user = await userModel.findOne({ email: body.email.trim().toLowerCase() })

    // Same message for "no such user" and "wrong password" so attackers can't find out which emails exist.
    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password)

    if (!isPasswordValid) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    res.cookie("token", signToken(user), getCookieOptions())

    res.status(200).json({
        message: "User loggedIn successfully.",
        user: toPublicUser(user)
    })
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    const token = req.cookies?.token

    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    // clearCookie must use the same options (minus maxAge) that were used to set the cookie.
    const { maxAge, ...clearOptions } = getCookieOptions()
    res.clearCookie("token", clearOptions)

    res.status(200).json({
        message: "User logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id)

    // The token can be valid for a user that was deleted from the database.
    if (!user) {
        return res.status(401).json({ message: "User no longer exists." })
    }

    res.status(200).json({
        message: "User details fetched successfully",
        user: toPublicUser(user)
    })
}


module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}
