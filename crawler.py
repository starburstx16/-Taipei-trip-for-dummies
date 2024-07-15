import requests
import json
import mysql.connector

def get_place_details(place_id, api_key):
    url = f'https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=name,formatted_address,formatted_phone_number,opening_hours,reviews,photos,rating,geometry,price_level&language=zh-TW&key={api_key}'
    response = requests.get(url)
    if response.status_code == 200:
        place_data = response.json()
        return place_data
    else:
        print(f"Failed to retrieve details for place with Place ID: {place_id}. Status code:", response.status_code)
        return None

def extract_user_name(review):
    # 從評論中獲取用户名
    return review.get('author_name', 'Anonymous')

def get_photos_with_fixed_format(photos, api_key):
    # 將照片大小固定為 400x600，並將照片 URL 加入到 fixed_photos 列表中
    fixed_photos = []
    for photo in photos:
        photo_reference = photo.get('photo_reference', '')
        photo_url = f'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&maxheight=600&photoreference={photo_reference}&key={api_key}'
        fixed_photo = {
            "widthPx": 400,
            "heightPx": 600,
            "photo_url": photo_url
        }
        fixed_photos.append(fixed_photo)
    return fixed_photos

def get_restaurants_in_taipei(min_rating, api_key):
    url = f'https://maps.googleapis.com/maps/api/place/textsearch/json?query=餐廳類型+in+Taipei&language=zh-TW&key={api_key}'
    next_page_token = None
    while True:
        if next_page_token:
            url = f'https://maps.googleapis.com/maps/api/place/textsearch/json?query=餐廳類型+in+Taipei&language=zh-TW&key={api_key}&pagetoken={next_page_token}'
        response = requests.get(url)
        if response.status_code == 200:
            restaurants_data = response.json()
            for result in restaurants_data['results']:
                place_id = result['place_id']
                restaurant_details = get_place_details(place_id, api_key)
                if restaurant_details:
                    # 檢查餐廳評分是否大於等於最低要求
                    rating = restaurant_details.get('result', {}).get('rating', 0)
                    if rating >= min_rating:
                        # 處理獲取到的餐廳詳細信息
                        name = restaurant_details.get('result', {}).get('name', 'N/A')
                        address = restaurant_details.get('result', {}).get('formatted_address', 'N/A')
                        phone_number = restaurant_details.get('result', {}).get('formatted_phone_number', 'N/A')
                        opening_hours = restaurant_details.get('result', {}).get('opening_hours', {}).get('weekday_text', 'N/A')
                        # 獲取所有評論
                        reviews = restaurant_details.get('result', {}).get('reviews', [])
                        # 將星級評論分為好評和差評
                        good_reviews = []
                        bad_reviews = []
                        for review in reviews:
                            if review.get('rating', 0) > 3:
                                good_reviews.append({'author_name': extract_user_name(review), 'text': review.get('text', '')})
                            else:
                                bad_reviews.append({'author_name': extract_user_name(review), 'text': review.get('text', '')})
                        good_reviews_json = json.dumps(good_reviews)
                        bad_reviews_json = json.dumps(bad_reviews)
                        # 處裡照片數據，固定格式
                        photos = get_photos_with_fixed_format(restaurant_details.get('result', {}).get('photos', []), api_key)
                        photos_json = json.dumps(photos)
                        # 獲取餐廳經緯度
                        location = restaurant_details.get('result', {}).get('geometry', {}).get('location')
                        if location:
                            latitude = location.get('lat')
                            longitude = location.get('lng')
                        else:
                            latitude = None
                            longitude = None
                        
                        # 連接到 MySQL 資料庫
                        db = mysql.connector.connect(
                            host="localhost",
                            user="root",
                            password="your_password",
                            database="sql_test"
                        )
                        cursor = db.cursor()
                        
                        # 插入數據到資料庫
                        sql = "INSERT INTO restaurant (name, rating, class, address, phone_number, opening_hours, good_reviews, bad_reviews, photos, latitude, longitude) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
                        val = (name, rating, 'class名稱', address, phone_number, json.dumps(opening_hours), good_reviews_json, bad_reviews_json, photos_json, latitude, longitude)
                        cursor.execute(sql, val)
                        
                        db.commit()
                        db.close()
                        
                        print("Data inserted successfully.")
            
            # 檢查是否還有下一頁
            next_page_token = restaurants_data.get('next_page_token')
            if not next_page_token:
                break
                
        else:
            print("Failed to retrieve restaurant data. Status code:", response.status_code)
            break



api_key = 'your_api_key'

min_rating = 4.5

get_restaurants_in_taipei(min_rating, api_key)
