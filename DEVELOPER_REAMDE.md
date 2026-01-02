## RUN APPLICATION FOR DEVELOPERS
1. Backend:
1.1 run docker desktop
1.2 docker-compose up -d db --build # leave it running
1.3 docker-compose up backend --build # no need to restart when doing changes
2. Frontend:
2.1 npm start # run frontend with listening to changes - no need to restart when doing changes
3. DB
3.1 run seed data - make sure db is running 
**WHEN?**
1. first time running app
2. db restart
3. pull from dev after db models changed.
**HOW?**
1. docker-compose run --rm seed_data
access app - http://localhost:3000 - frontend & backend
access app - http://localhost:8000/docs - only backend swagger
