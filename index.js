const express = require('express');
const app = express();
const http = require('http');
const axios = require('axios');
const steamWebApi = require('./steam-web-api');
const { parse, stringify } = require('flatted/cjs');

app.set('view engine', 'ejs');

const apiKey = 'YOUR API KEY';
const steamId = 'YOUR STEAM ID';
const appId = 378120;
const steamClient = new steamWebApi(apiKey);

app.get('/', (req, res) => {
  res.status(200).render('index', (err, html) => {
    return res.send(html);
  });
});

app.get('/profile', (req, res) => {
  steamClient.getPlayerSummaries(
    steamId + ',STEAM ID',
    (err, response) => {
      try {
        res
          .status(200)
          .render(
            'profile',
            { players: response.response.players },
            (err, html) => {
              res.send(html);
            }
          );
      } catch (error) {
        console.log('error: ', error);
      }
    }
  );
});

app.get('/getFriendList', (req, res) => [
  steamClient.getFriendList(steamId, (err, response) => {
    res.render('friendList', { friends: response.friendslist.friends });
  }),
]);

app.get('/getOwnedGames', async (req, res) => {
  try {
    await steamClient.getOwnedGames(steamId, async (err, response) => {
      try {
        const gamesData = response.response || {};
        return await res.render('ownedGames', {
          game_count: gamesData.game_count,
          games: gamesData.games,
        });
      } catch (error) {
        return next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/getRecentlyPlayedGames', (req, res) => {
  const steamId = 'STEAM ID';
  steamClient.getRecentlyPlayedGames(steamId, (err, response) => {
    const { total_count, games } = response.response;
    res.render('recentGames', { total_count, games });
  });
});

app.get('/getSchemaForGame', (req, res) => {
  steamClient.getSchemaForGame(appId, (err, response) => {
    const { gameName, gameVersion, availableGameStats } = response.game;
    res.render('schemaForGame', { gameName, gameVersion, availableGameStats });
  });
});

app.get('/getPlayerBans', (req, res) => {
  steamClient.getPlayerBans(steamId + ',STEAM ID', (err, response) => {
    res.render('playerBans', { players: response.players });
  });
});

app.get('/getGlobalAchievementPercentagesForApp', (req, res) => {
  steamClient.getGlobalAchievementPercentagesForApp(440, (err, response) => {
    try {
      res.render('globalAchievementPercentagesForApp', {
        achievements: response.achievementpercentages.achievements,
      });
    } catch (error) {
      console.log('error: ', error);
    }
  });
});

app.get('/getNewsForApp', (req, res) => {
  steamClient.getNewsForApp(
    440,
    { count: 10, maxlength: 50 },
    (err, response) => {
      try {
        res.render('newsForApp', { appnews: response.appnews });
      } catch (error) {
        console.log('error" ', error);
      }
    }
  );
});

app.get('/getUserStatsForGame', (req, res) => {
  steamClient.getUserStatsForGame(appId, steamId, (err, response) => {
    res.render('userStatsForGame', { playerStats: response.playerstats });
  });
});

app.get('/getUserWishlist', (req, res) => {
  (async () => {
    try {
      await axios
        .get(
          'https://store.steampowered.com/wishlist/profiles/"STEAM ID"/wishlistdata/'
        )
        .then((response) => {
          const data = JSON.parse(stringify(response.data));
          const gameIDs = data[0];
          const wishList = [];
          Object.keys(gameIDs).forEach((key) => {
            // console.log(key);
            // console.log(response.data[key]);
            const wish = { ...response.data[key] };
            wish.gameID = key;
            wishList.push(wish);
          });
          res.render('userWishList', { wishList });
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {});
    } catch (error) {
      console.log(error.response.body);
    }
  })();
});

const server = app.listen(3000, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log(`We are running on ${port}`);
});
