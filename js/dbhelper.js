const dbPromise = idb.open("restaurants", 1, upgradeDb => {
  const keyValStore = upgradeDb.createObjectStore("restaurants", {
    keyPath: "id"
  });
});
/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://192.168.0.101:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // old code
    // let xhr = new XMLHttpRequest();
    // xhr.open("GET", DBHelper.DATABASE_URL);
    // xhr.onload = () => {
    //   if (xhr.status === 200) {
    //     // Got a success response from server!
    //     const json = JSON.parse(xhr.responseText);
    //     console.log(json);
    //     const restaurants = json;
    //     callback(null, restaurants);
    //   } else {
    //     // Oops!. Got an error from server.
    //     const error = `Request failed. Returned status of ${xhr.status}`;
    //     callback(error, null);
    //   }
    // };
    // xhr.send();
    dbPromise.then(db => {
      const index = db.transaction("restaurants").objectStore("restaurants");
      let served = false;
      index.getAll().then(restaurants => {
        console.log(restaurants);
        if (restaurants) {
          callback(null, restaurants);
          served = true;
        }
        fetch(DBHelper.DATABASE_URL)
          .then(json => json.json())
          .then(restaurants2 => {
            if (!db) return;

            const tx = db.transaction("restaurants", "readwrite");
            var store = tx.objectStore("restaurants");
            restaurants2.forEach(restaurant => store.put(restaurant));
            if (!served || restaurants.length < restaurants2.length)
              callback(null, restaurants2);
          })
          .catch(err => {
            if (!served) callback(err, null);
          });
      });
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    dbPromise.then(db => {
      const index = db.transaction("restaurants").objectStore("restaurants");
      let served = false;
      index.getAll().then(restaurants => {
        if (restaurants) {
          const restaurant = restaurants.find(r => r.id == id);
          if (restaurant) {
            callback(null, restaurant);
            served = true;
          }
        }
        fetch(`${DBHelper.DATABASE_URL}/${id}`)
          .then(json => json.json())
          .then(restaurant2 => {
            if (!db) return;

            const tx = db.transaction("restaurants", "readwrite");
            const store = tx.objectStore("restaurants");
            store.put(restaurant2);
            if (!served) callback(null, restaurant2);
          })
          .catch(() => {
            if (!served) callback("Restaurant does not exist", null);
          });
      });
    });
    //   DBHelper.fetchRestaurants((error, restaurants) => {
    //     if (error) {
    //       callback(error, null);
    //     } else {
    //       const restaurant = restaurants.find(r => r.id == id);
    //       if (restaurant) {
    //         // Got the restaurant
    //         callback(null, restaurant);
    //       } else {
    //         // Restaurant does not exist in the database
    //         callback("Restaurant does not exist", null);
    //       }
    //     }
    //   });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph) {
      return `/img/${restaurant.photograph}.jpg`;
    }
    // fix for missing photograph property, using image 10 as fallback image
    return "/img/10.jpg";
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
}
