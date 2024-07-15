from flask import Flask, render_template, jsonify, request, redirect, session, flash, url_for
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn import preprocessing
from sklearn.metrics import accuracy_score
import mysql.connector
import json
import pandas as pd
from flask_cors import CORS
import os
import random

# 指定模板和靜態文件目錄
project_dir = os.path.abspath('project_front')
template_dir = project_dir  # 如果 HTML 在 project_front 根目錄
static_dir = project_dir    # 如果 CSS, JS, img 在 project_front 的子資料夾

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir, static_url_path='')
app.secret_key = 'your_secret_key'  # 使用session時會用到
CORS(app)

# 連接 MySQL 資料庫
connection = mysql.connector.connect(
    host="localhost",
    user="root",
    password="your_password",
    database="sql_test"
)
cursor = connection.cursor()

@app.route('/')
def index():
    return render_template('index.html', logged_in=('email' in session))

@app.route('/foodpage')
def foodpage():
    cursor.execute("SELECT name, latitude, longitude, class FROM test_restaurants")
    results = cursor.fetchall()
    locations = [{'name': result[0], 'latitude': result[1], 'longitude': result[2], 'class': result[3]} for result in results]
    
    favorite_restaurants = session.get('favorite_restaurants', []) if 'email' in session else []
    
    return render_template('foodpage.html', locations=locations, favorite_restaurants=favorite_restaurants, logged_in=('email' in session))


@app.route('/login', methods=['POST'])
def login():
    email = request.form['email']
    password = request.form['password']
    cursor.execute("SELECT * FROM customer WHERE email = %s AND 密碼 = %s", (email, password))
    user = cursor.fetchone()
    if user:
        session['email'] = user[3]
        
        # 获取用户的收藏餐厅并存入session
        cursor.execute("SELECT 喜好餐廳 FROM customer WHERE email = %s", (email,))
        favorite_restaurants = cursor.fetchone()[0]
        session['favorite_restaurants'] = favorite_restaurants.split(', ') if favorite_restaurants else []

        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "error": "帳號密碼有誤，請重新輸入"})


@app.route("/signout")
def signout():
    session.pop("email", None)
    session.pop("favorite_restaurants", None)
    return redirect("/")

@app.route('/register', methods=['POST'])
def register():
    nickname = request.form['nickname']
    age = int(request.form['age'])
    email = request.form['email']
    password = request.form['password']
    gender = int(request.form['gender'])
    marriage_status = int(request.form['marriage_status'])
    num_family_member = int(request.form['num_family_member'])
    location = int(request.form['location'])
    vagetarian = int(request.form['vagetarian'])
    new_data = [[age, location, marriage_status, num_family_member, gender]]

    if vagetarian == 0:
        if new_data is not None:
            df = pd.read_csv("C:/Users/rober/OneDrive/桌面/finalTEST/project_front/traindata.csv")  # 請更新這個路徑
            X = df[["年齡", "居住地", "婚姻狀況", "小孩數量", "性別"]]
            y = df["遊客喜好餐廳"]

            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
            scaler = preprocessing.StandardScaler().fit(X_train)
            X_train = scaler.transform(X_train)

            model = DecisionTreeClassifier(max_depth=4)
            model.fit(X_train, y_train)

            new_data = scaler.transform(new_data)
            data_pred = model.predict(new_data)[0]

        cursor.execute("SELECT email FROM customer WHERE email = %s", (email,))
        result = cursor.fetchone()
        if result:
            return redirect("/error?msg=信箱已經被註冊")
        else:
            cursor.execute("INSERT INTO customer (姓名, 年齡, email, 密碼, 性別, 婚姻狀況, 小孩數量, 居住地, 飲食喜好, 遊客喜好餐廳) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", (nickname, age, email, password, gender, marriage_status, num_family_member, location, vagetarian, int(data_pred)))
            connection.commit()
        return redirect("/")
    else:
        cursor.execute("SELECT email FROM customer WHERE email = %s", (email,))
        result = cursor.fetchone()
        if result:
            return redirect("/error?msg=信箱已經被註冊")
        else:
            cursor.execute("INSERT INTO customer (姓名, 年齡, email, 密碼, 性別, 婚姻狀況, 小孩數量, 居住地, 飲食喜好, 遊客喜好餐廳) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", (nickname, age, email, password, gender, marriage_status, num_family_member, location, vagetarian, 4))
            connection.commit()
        return redirect("/")

@app.route('/test_restaurants')
def get_restaurants():
    category = request.args.get('category', 'all')
    if category == 'all':
        query = "SELECT name, latitude, longitude, class, rating, address, phone_number, opening_hours, good_reviews, bad_reviews, photos FROM test_restaurants"
    else:
        query = "SELECT name, latitude, longitude, class, rating, address, phone_number, opening_hours, good_reviews, bad_reviews, photos FROM test_restaurants WHERE class = %s"
    cursor.execute(query, (category,) if category != 'all' else ())
    results = cursor.fetchall()
    table = [{'name': result[0], 'latitude': result[1], 'longitude': result[2], 'class': result[3], 'rating': result[4], 'address': result[5], 'phone_number': result[6], 'opening_hours': result[7], 'good_reviews': result[8], 'bad_reviews': result[9], 'photos': result[10]} for result in results]
    return jsonify({'table': table})

@app.route('/search')
def search():
    searchTerm = request.args.get('term')
    query = f"SELECT name, latitude, longitude, class, rating, address, phone_number, opening_hours, good_reviews, bad_reviews, photos FROM test_restaurants WHERE name LIKE '%{searchTerm}%'"
    cursor.execute(query)
    results = cursor.fetchall()
    table = [{'name': result[0], 'latitude': result[1], 'longitude': result[2], 'class': result[3], 'rating': result[4], 'address': result[5], 'phone_number': result[6], 'opening_hours': result[7], 'good_reviews': result[8], 'bad_reviews': result[9], 'photos': result[10]} for result in results]
    return jsonify({'table': table})


############################## 推薦系統 #####################################
@app.route('/train')
def train():
    email = session.get("email", None)
    cursor = connection.cursor()
    cursor.execute("SELECT 遊客喜好餐廳 FROM customer WHERE email = %s", (email,))
    prediction = cursor.fetchone()
    if prediction is not None and prediction[0] is not None:
        if int(prediction[0]) == 0:
            random_json = get_random_json_from_bar_class()
        elif int(prediction[0]) == 1:
            random_json = get_random_json_from_chinese_class()
        elif int(prediction[0]) == 2:
            random_json = get_random_json_from_teatime_class()
        else:
            random_json = get_random_json_from_vegan_class()
    else:
        random_json = ''
    session["random_json"] = random_json
    return jsonify(random_json)


def extract_photo_references(results):
    random_photos = []
    for item in results:
        json_data = item[-1]  # 假設照片資料的字串位於元組中的最後一個位置
        parsed_json = json.loads(json_data)
        photo_references = [photo_data.get("photo_reference") for photo_data in parsed_json if photo_data.get("photo_reference")]
        selected_references = random.sample(photo_references, min(3, len(photo_references)))
        random_photos.extend(selected_references)
    return random_photos

def get_random_json_from_bar_class():
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT name, rating, address, phone_number, opening_hours, good_reviews, photos FROM test_restaurants WHERE class = 'bar'")
        results = cursor.fetchall()
        random_results = random.sample(results, 3)
        
        restaurant_names = [{"name": result[0], "rating": float(result[1]), "address": result[2]} for result in random_results]
        random_photos = extract_photo_references(random_results)
        
        return random_photos, restaurant_names
    finally:
        cursor.close()

def get_random_json_from_teatime_class():
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT name, rating, address, phone_number, opening_hours, good_reviews, photos FROM test_restaurants WHERE class = 'teatime'")
        results = cursor.fetchall()
        random_results = random.sample(results, 3)
        
        restaurant_names = [{"name": result[0], "rating": float(result[1]), "address": result[2]} for result in random_results]
        random_photos = extract_photo_references(random_results)
        
        return random_photos, restaurant_names
    finally:
        cursor.close()

def get_random_json_from_chinese_class():
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT name, rating, address, phone_number, opening_hours, good_reviews, photos FROM test_restaurants WHERE class = 'chinese'")
        results = cursor.fetchall()
        random_results = random.sample(results, 3)
        
        restaurant_names = [{"name": result[0], "rating": float(result[1]), "address": result[2]} for result in random_results]
        random_photos = extract_photo_references(random_results)
        
        return random_photos, restaurant_names
    finally:
        cursor.close()

def get_random_json_from_vegan_class():
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT name, rating, address, phone_number, opening_hours, good_reviews, photos FROM test_restaurants WHERE class = 'vegan'")
        results = cursor.fetchall()
        random_results = random.sample(results, 3)
        
        restaurant_names = [{"name": result[0], "rating": float(result[1]), "address": result[2]} for result in random_results]
        random_photos = extract_photo_references(random_results)
        
        return random_photos, restaurant_names
    finally:
        cursor.close()

########################## LIKE BUTTON ############################
@app.route("/check", methods = ["GET"])
def check():
    if "email" in session:
        check = jsonify({"check": "Yes"})
    else:
        check = jsonify({"check": "None"})
    return check


@app.route("/checklike")
def checklike():
    return render_template('check.html', logged_in=('email' in session))

@app.route('/toggleFavorite', methods=['POST'])
def toggle_favorite():
    email = session.get("email", None)
    data = request.get_json()
    
    restaurant_name = data.get('restaurantName')  # 或者 data['restaurantName']
    json_string = json.dumps(restaurant_name, ensure_ascii=False) 
    new_r_name = json_string.replace('"', '')
    print(new_r_name)
    print(f"Restaurant Name: {new_r_name}, Email: {email} ")
    
    cursor = connection.cursor()

    try:
        # 取得原有的喜好餐廳資料
        select_query = """
        SELECT 喜好餐廳
        FROM customer
        WHERE email = %s
        """
        cursor.execute(select_query, (email,))
        existing_favorite_restaurant = cursor.fetchone()

        # 如果已經有喜好餐廳，且新的餐廳名稱已存在，則將其從喜好餐廳中刪除
        if existing_favorite_restaurant and existing_favorite_restaurant[0]:
            existing_favorite_restaurant = existing_favorite_restaurant[0]  # 從元組中取出喜好餐廳字串
            existing_favorite_restaurant_list = existing_favorite_restaurant.split(', ')
            if new_r_name in existing_favorite_restaurant_list:
                existing_favorite_restaurant_list.remove(new_r_name)
                updated_favorite_restaurant = ', '.join(existing_favorite_restaurant_list)
            else:
                updated_favorite_restaurant = existing_favorite_restaurant + ', ' + new_r_name
        else:
            updated_favorite_restaurant = new_r_name
        



        # 更新喜好餐廳資料
        update_query = """
        UPDATE customer
        SET 喜好餐廳 = %s
        WHERE email = %s
        """
        cursor.execute(update_query, (updated_favorite_restaurant, email))
        connection.commit()
        print("Record updated successfully")
    except mysql.connector.Error as error:
        print(f"Failed to update record in MySQL table: {error}")
    
    return jsonify({"message": "Favorite restaurant updated successfully"})
    

@app.route('/checkrestaurant', methods=['POST'])
def heart():
    email = session.get("email", None)
    cursor = connection.cursor()
    
    try:
        # 取得原有的喜好餐廳資料
        select_query = """
        SELECT 喜好餐廳
        FROM customer
        WHERE email = %s
        """
        cursor.execute(select_query, (email,))
        result = cursor.fetchone()
        if result:
            existed_favorite_restaurant = result[0].split(",")  # 假設餐廳是以逗號分隔儲存
        else:
            existed_favorite_restaurant = []
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database error"}), 500
    print(existed_favorite_restaurant)
    return jsonify({"favorites": existed_favorite_restaurant})

if __name__ == '__main__':
    app.run(debug=True)
