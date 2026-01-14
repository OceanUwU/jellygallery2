# jellygallery2

## setup
1. `npm install`
1. `npx drizzle-kit migrate`
1. create `.env` with the following contents and edit it to your needs:
    ```sh
    PORT=29511
    HOST=http://localhost:29511/
    NODE_ENV=production
    DB_FILE_NAME=file:data.db
    ```
1. `npm start`