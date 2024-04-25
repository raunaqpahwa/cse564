from flask import Flask, request
import pandas as pd
import numpy as np
from flask_cors import cross_origin, CORS

def create_treemap_data():
   result = {'name': 'Boroughs', 'children': []}
   boroughs = {'Manhattan': {}, 'Bronx': {}, 'Brooklyn': {}, 'Queens': {}, 'StatenIsland': {}}
   
   # Housing data
   # for borough in boroughs.keys():
   #    filtered = housing[housing['Borough'] == borough]
   #    boroughs[borough]['name'] = borough
   #    boroughs[borough]['children'] = [{'name': 'Total combined units', 'children': []}]
   #    current_props = boroughs[borough]['children'][-1]['children']
   #    for val in ['Extremely Low Income Units', 'Very Low Income Units', 'Low Income Units', 'Moderate Income Units', 'Middle Income Units', 'Other Income Units', 'Studio Units', '1-BR Units', '2-BR Units', '3-BR Units', '4-BR Units', '5-BR Units', '6-BR+ Units', 'Counted Rental Units', 'Counted Homeownership Units']:
   #       current_props.append({'name': val, 'value': int(filtered[val].sum())})
   
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

housing = pd.read_csv('./housing_cleaned.csv')
schools = pd.read_csv('./schools_cleaned.csv')
computers = pd.read_csv('./computers_cleaned.csv')
hospitals = pd.read_csv('./hospitals_cleaned.csv')
colleges = pd.read_csv('./colleges_cleaned.csv')

treemap_data = create_treemap_data()

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



if __name__ == "__main__":
  app.run(host='localhost', port=8000)