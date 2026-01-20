import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  try {
    if (!token)
      return res.status(401).json({
        success: false,
        message: "Unauthorized / no token provied",
      });

    const decoded = jwt.verify(token, process.env.JWT_SECERT);
    if (!decoded)
      return res.status(401).json({
        success: false,
        message: "Unauthorized / no token provied",
      });
    res.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
