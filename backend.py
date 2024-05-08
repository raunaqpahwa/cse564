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

avg_distances = {'Manhattan': {'Schools': 3.63, 'Computers': 4.12, 'Hospitals': 4.137, 'Colleges': 3.866},
                 'Brooklyn': {'Schools': 3.91, 'Computers': 4.05, 'Hospitals': 3.43, 'Colleges': 3.35},
                 'Queens': {'Schools': 5.498, 'Computers': 5.61, 'Hospitals': 4.858, 'Colleges': 4.9914},
                 'StatenIsland': {'Schools': 3.13, 'Computers': 3.486, 'Hospitals': 2.937, 'Colleges': 2.7},
                 'Bronx': {'Schools': 2.508, 'Computers': 2.789, 'Hospitals': 2.665, 'Colleges': 3.149},
                 'All': {'Schools': 8.42, 'Computers': 8.473, 'Hospitals': 7.813, 'Colleges': 7.455}}

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



if __name__ == "__main__":
  app.run(host='localhost', port=8000)