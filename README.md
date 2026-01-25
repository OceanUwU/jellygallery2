# jellygallery2

## setup
1. `npm install`
1. `npx drizzle-kit migrate`
1. create `.env` with the following contents and edit it to your needs:
    ```sh
    PORT=29511
    HOST=http://localhost:29511/
    NODE_ENV=production
    SECRET=SOMERANDOMSUPERLONGSTRING
    DISCORD_APP_ID=1234567890
    DISCORD_APP_SECRET=XXXXXXXXXX
    AUTHORISED_USERS=1234567890,1234567891,1234567892
    ```
    `HOST` is the base url the site will be hosted on
    `DISCORD_APP` settings can be obtained from [here](https://discord.com/developers/applications) by creating an application (make sure you add `HOST/auth/cb` as a redirect in the oauth settings where `HOST` is the same as `HOST` in your .env file!)
    `AUTHORISED_USERS` is a comma-separated list of [discord user ids](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID) who are authorised to use the editor tools at `/admin`
1. run `npm start` or press F5 in VScode if youre developing