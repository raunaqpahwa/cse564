from flask import Flask, request
import pandas as pd
import numpy as np
from flask_cors import cross_origin, CORS
from geopy.distance import geodesic

def create_treemap_data():
   result = {'name': 'Boroughs', 'children': []}
   boroughs = {'Manhattan': {}, 'Bronx': {}, 'Brooklyn': {}, 'Queens': {}, 'StatenIsland': {}}

   # Computers data
   for borough in boroughs.keys():
      filtered = computers[computers['Borough'] == borough]
      boroughs[borough]['name'] = borough
      boroughs[borough]['children'] = [{'name': 'Computer centres', 'children': []}]
      current_props = boroughs[borough]['children'][-1]['children']
      for val in ['Wheelchair Accessible', 'Assistive Technology', 'Affordability Connectivity Program', 'Productivity Tools', 'Job Readiness', 'Education', 'Creative Expression', 'Media and Entertainment', 'Certifications', 'Digital Literacy']:
         current_props.append({'name': val, 'value': len(filtered[filtered[val] == 'Yes'])})
      current_props.append({'name': 'Oversight Agency', 'children': []})
      for agency, count in filtered['Oversight Agency'].value_counts().items():
         current_props[-1]['children'].append({'name': agency, 'value': int(count)})
   
   # Hospitals data
   for borough in boroughs.keys():
      filtered = hospitals[hospitals['Borough'] == borough]
      boroughs[borough]['children'].append({'name': 'Hospitals', 'children': []})
      current_props = boroughs[borough]['children'][-1]['children']
      for facility_type, count in filtered['Facility Type'].value_counts().items():
         current_props.append({'name': facility_type, 'value': int(count)})
   
   # Schools data
   for borough in boroughs.keys():
      filtered = schools[schools['Borough'] == borough]
      boroughs[borough]['children'].append({'name': 'Schools', 'value': len(filtered)})

   # Colleges data
   for borough in boroughs.keys():
      filtered = colleges[colleges['Borough'] == borough]
      boroughs[borough]['children'].append({'name': 'Colleges', 'value': len(filtered)})
   
   for key, value in boroughs.items():
      result['children'].append({'name': key, 'children': value['children']})
   
   return result

# avg_distances = [[{'Schools': 2.508, 'Computers': 2.789, 'Hospitals': 2.665, 'Colleges': 3.149}],
#                  [{'Schools': 3.91, 'Computers': 4.05, 'Hospitals': 3.43, 'Colleges': 3.35}],
#                  [{'Schools': 3.63, 'Computers': 4.12, 'Hospitals': 4.137, 'Colleges': 3.866}],
#                  [{'Schools': 5.498, 'Computers': 5.61, 'Hospitals': 4.858, 'Colleges': 4.9914}],
#                  [{'Schools': 3.13, 'Computers': 3.486, 'Hospitals': 2.937, 'Colleges': 2.7}]]

avg_distances = [[{'axis': 'Schools', 'value': 2.508, 'borough': 'Bronx'}, {'axis': 'Computers', 'value': 2.789, 'borough': 'Bronx'}, 
                     {'axis': 'Hospitals', 'value': 2.665, 'borough': 'Bronx'}, {'axis': 'Colleges', 'value': 3.149, 'borough': 'Bronx'}],
                 [{'axis': 'Schools', 'value': 3.91, 'borough': 'Brooklyn'}, {'axis': 'Computers', 'value': 4.05, 'borough': 'Brooklyn'}, 
                     {'axis': 'Hospitals', 'value': 3.43, 'borough': 'Brooklyn'}, {'axis': 'Colleges', 'value': 3.35, 'borough': 'Brooklyn'}],
                 [{'axis': 'Schools', 'value': 3.63, 'borough': 'Manhattan'}, {'axis': 'Computers', 'value': 4.12, 'borough': 'Manhattan'}, 
                     {'axis': 'Hospitals', 'value': 4.137, 'borough': 'Manhattan'}, {'axis': 'Colleges', 'value': 3.866, 'borough': 'Manhattan'}],
                 [{'axis': 'Schools', 'value': 5.498, 'borough': 'Queens'}, {'axis': 'Computers', 'value': 5.61, 'borough': 'Queens'}, 
                     {'axis': 'Hospitals', 'value': 4.858, 'borough': 'Queens'}, {'axis': 'Colleges', 'value': 4.9914, 'borough': 'Queens'}],
                 [{'axis': 'Schools', 'value': 3.13, 'borough': 'StatenIsland'}, {'axis': 'Computers', 'value': 3.486, 'borough': 'StatenIsland'}, 
                     {'axis': 'Hospitals', 'value': 2.937, 'borough': 'StatenIsland'}, {'axis': 'Colleges', 'value': 2.7, 'borough': 'StatenIsland'}]]

# Precompute all the above distances
# def create_distance_data():
#    total_miles = 0
#    total_points = 0
#    for index, housing_row in housing.iterrows():
#       for index, schools_row in colleges.iterrows():
#          total_miles += geodesic((housing_row['Latitude'], housing_row['Longitude']), (schools_row['Latitude'], schools_row['Longitude'])).miles
#          total_points += 1
#    print(f'Avg dist: {total_miles/total_points}, Total Pts: {total_points}, Tot miles: {total_miles}')


housing = pd.read_csv('./housing_cleaned.csv')
schools = pd.read_csv('./schools_cleaned.csv')
computers = pd.read_csv('./computers_cleaned.csv')
hospitals = pd.read_csv('./hospitals_cleaned.csv')
colleges = pd.read_csv('./colleges_cleaned.csv')
crimes = pd.read_csv('./crimes.csv')
treemap_data = create_treemap_data()
# create_distance_data()

# API's
app = Flask(__name__)
CORS(app)

@app.route('/bar_chart')
@cross_origin(origins=['*'])
def bar_chart():
   bar_data = []
   borough_housing_data = housing.groupby('Borough').size()
   borough_housing_data = borough_housing_data.to_dict()
   for borough, size in borough_housing_data.items():
        bar_data.append({'borough': borough, 'size': size})
   return bar_data

@app.route('/tree_map')
@cross_origin(origins=['*'])
def tree_map():
   return treemap_data

@app.route('/borough_bar_chart')
@cross_origin(origins=['*'])
def borough_bar_chart():
   borough = request.args.get('borough')
   result = []
   filtered_housing = housing[housing['Borough'] == borough]
   for key in ['Low Income Units', 'Moderate Income Units', 'Middle Income Units',
       'Other Income Units', 'Studio Units', '1-BR Units', '2-BR Units',
       '3-BR Units', '4-BR Units', 'Counted Rental Units', 'Counted Homeownership Units']:
      result.append({'name': key.replace('Income', 'Inc.')
                     .replace('Units', '').replace('Counted', '')
                     .replace('Moderate', 'Mod.')
                     .replace('Rental', 'Rent')
                     .strip(), 
                     'value': len(filtered_housing[filtered_housing[key] > 0])})
   return result

@app.route('/crime_radar')
@cross_origin(origins=['*'])
def crime_radar_chart():
   return crimes.sort_values('Borough').filter(items=['Robbery', 'Rape,Murder', 'Felony Assault', 'Burglary', 'Grand Larceny', 'Grand Larceny of MV']).to_json(orient='records')


@app.route('/dist_radar')
@cross_origin(origins=['*'])
def dist_radar_chart():
   return avg_distances



if __name__ == "__main__":
  app.run(host='localhost', port=8000)