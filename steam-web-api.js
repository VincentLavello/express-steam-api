var http = require('http');

function steamWebApi(apiKey) {
  if (apiKey === undefined) {
    throw 'No API key definded';
    return;
  }

  this.apiKey = apiKey;

  return this;
}

/**
	returns the latest of a game specified by its appID.
	
	(appId, options, callback) or (appId, callback)
*/
steamWebApi.prototype.getNewsForApp = function (appId, a, b) {
  return makeRequest(
    '/ISteamNews/GetNewsForApp/v0002/?appid=' + appId,
    b === undefined ? {} : a,
    b === undefined ? a : b
  );
};

/**
	returns global achievements overview of a specific game in percentages.

	(gameId, options, callback) or (gameId, callback)
*/
steamWebApi.prototype.getGlobalAchievementPercentagesForApp = function (
  gameId,
  a,
  b
) {
  return makeRequest(
    '/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=' +
      gameId,
    b === undefined ? {} : a,
    b === undefined ? a : b
  );
};

/**
	returns basic profile information for a list of 64-bit Steam IDs.

	(steamIds, options, callback) or (steamIds, callback)
*/
steamWebApi.prototype.getPlayerSummaries = function (steamIds, a, b) {
  return makeRequest(
    '/ISteamUser/GetPlayerSummaries/v0002/?key=' +
      this.apiKey +
      '&steamids=' +
      splat(steamIds).join(','),
    b === undefined ? {} : a,
    b === undefined ? a : b
  );
};

/**
	returns the friend list of any Steam user, provided his Steam Community profile visibility is set to "Public".

	Option of relationship defaults to 'friend'
*/
steamWebApi.prototype.getFriendList = function (steamId, a, b) {
  var options = b === undefined ? {} : a;
  if (!options.relationship) {
    options.relationship = 'friend';
  }
  return makeRequest(
    '/ISteamUser/GetFriendList/v0001/?key=' +
      this.apiKey +
      '&steamid=' +
      steamId,
    options,
    b === undefined ? a : b
  );
};

/**
	returns GetOwnedGames returns a list of games a player owns along with some playtime information, if the profile is publicly visible. Private, friends-only, and other privacy settings are not supported unless you are asking for your own personal details (ie the WebAPI key you are using is linked to the steamid you are requesting).

	(steamId, options, callback)
*/
steamWebApi.prototype.getOwnedGames = function (steamId, a, b) {
  return makeRequest(
    `/IPlayerService/GetOwnedGames/v0001/?key=${this.apiKey}&steamid=${steamId}`,
    b === undefined ? {} : a,
    b === undefined ? a : b
  );
};

/**
	returns a list of games a player has played in the last two weeks, if the profile is publicly visible. Private, friends-only, and other privacy settings are not supported unless you are asking for your own personal details (ie the WebAPI key you are using is linked to the steamid you are requesting).

	@steamid
		The SteamID of the account.
	@count
		Optionally limit to a certain number of games (the number of games a person has played in the last 2 weeks is typically very small)
	@format
		Output format. json (default), xml or vdf.
*/
steamWebApi.prototype.getRecentlyPlayedGames = function (steamId, a, b) {
  return makeRequest(
    `/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${this.apiKey}&steamid=${steamId}`,
    b === undefined ? {} : a,
    b === undefined ? a : b
  );
};

/**
	returns gamename, gameversion and availablegamestats(achievements and stats).

	@appid
		The AppID of the game you want stats of
	@format
		Output format. json (default), xml or vdf.
	@l (Optional)
		Language. If specified, it will return language data for the requested language.
*/
steamWebApi.prototype.getSchemaForGame = function (appId, a, b) {
  return makeRequest(
    `/ISteamUserStats/GetSchemaForGame/v2/?key=${this.apiKey}&appid=${appId}`,
    b === undefined ? {} : a,
    b === undefined ? a : b
  );
};

/**
	returns Community, VAC, and Economy ban statuses for given players.

	@steamids
		Comma-delimited list of SteamIDs
*/
steamWebApi.prototype.getPlayerBans = function (steamId, a, b) {
  return makeRequest(
    `/ISteamUser/GetPlayerBans/v1/?key=${this.apiKey}&steamids=${steamId}`,
    b === undefined ? {} : a,
    b === undefined ? a : b
  );
};

/**
	returns a list of achievements for this user by app id
*/
steamWebApi.prototype.getUserStatsForGame = function (appId, steamId, a, b) {
  return makeRequest(
    `/ISteamUserStats/GetUserStatsForGame/v0002/?key=${this.apiKey}&appid=${appId}&steamid=${steamId}`,
    b === undefined ? {} : a,
    b === undefined ? a : b
  );
};

/**
 returns the wishlist of the user
 */
steamWebApi.prototype.getUserWishlist = function (steamId, a, b) {
  // return makeRequest(
  //   `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/`,
  //   b === undefined ? {} : a,
  //   b === undefined ? a : b
  // );
  // const req = http.request(
  //   {
  //     host: `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/`,
  //     method: 'GET',
  //   },
  //   function (res) {
  //     res.on('data', function (data) {});
  //     res.on('end', function () {});
  //     res.on('close', function () {
  //       res.emit('end');
  //     });
  //   }
  // );
  // return req;
};

/**
	Private function, used to make requests to Steam

	Takes the path, any options (becomes query params) & a callback

	Returns the HTTP request instance
*/
function makeRequest(path, opts, callback) {
  var key,
    req,
    dataStr = '';

  if (callback === undefined) {
    throw 'No callback defined';
    return;
  }

  for (key in opts) {
    path += '&' + key + '=' + opts[key];
  }

  req = http.request(
    {
      host: 'api.steampowered.com',
      port: 80,
      path: path,
      method: 'GET',
    },
    function (res) {
      res.on('data', function (data) {
        dataStr += data;
      });

      res.on('end', function () {
        if (opts.format === undefined || opts.format.toLowerCase() == 'json') {
          try {
            callback(null, JSON.parse(dataStr));
          } catch (err) {
            callback(null, dataStr);
          }
        } else {
          callback(null, dataStr);
        }
      });

      res.on('close', function () {
        res.emit('end');
      });
    }
  );

  req.end();

  req.on('error', function (err) {
    callback(err);
  });

  return req;
}

/**
	Ensures argument is an array
*/
function splat(arg) {
  return Array.isArray(arg) ? arg : [arg];
}

module.exports = steamWebApi;
