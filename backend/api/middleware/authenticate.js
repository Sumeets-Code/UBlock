import jwtProvider from "../config/jwtProvider";

const authenticate = async(req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if(!token) {
            return res.status(404).send({error: "token not found"});
        }

        const userId = jwtProvider.getIdByToken(token);
        // const user = await 
        req.user = user;

        next();
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
}

export default authenticate;