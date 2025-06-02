# project
npm i cloudinary
npm i multer



ACCESS TOKEN - It gives the acces of the application to the user but it's time duration is very short and expires  quickly (usually in minutes) for security reasons.
Due to which the user have to login again and again

REFRESH TOKEN - It generates with the access token and saves in the database so that when access token expires user will not be logged out and it create new access token for the user 
It is stored securely (usually in an HTTP-only cookie or database).


When the access token expires, the refresh token can be used to request a new access token without asking the user to log in again.
It is a longer-lived token issued alongside the access token during login


🔁 Example Flow:
User logs in → Server issues access token and refresh token.

Access token expires → App sends refresh token to get a new access token.

If refresh token is valid → New access token is sent → User continues.

If refresh token is expired or invalid → User must log in again.