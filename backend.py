from constants import metadata
from flask import Flask, request
import pandas as pd
import numpy as np
from flask_cors import cross_origin, CORS
from sklearn.cluster import KMeans
from sklearn.manifold import MDS
from sklearn.preprocessing import OneHotEncoder

df = pd.read_csv('./data.csv')
df_numerical = df.copy(deep=True)

# Normalise numerical variables
for col in metadata.keys():
    if metadata[col]['isCategorical']:
        df_numerical = df_numerical.drop(col, axis=1)

# Normalise numerical data
df_numerical = (df_numerical - df_numerical.min()) / (df_numerical.max() - df_numerical.min())
correlation = df_numerical.corr()
dissimilarity = 1 - np.abs(correlation)

# MDS calculations for data
embeddings_data = MDS(n_components=2, metric=True, dissimilarity='euclidean')
data_mds = embeddings_data.fit_transform(df_numerical)

# MDS calculations for features
embeddings_features = MDS(n_components=2, metric=True, dissimilarity='precomputed')
features_mds = embeddings_features.fit_transform(dissimilarity)

# Calculate n = 1..10 clusters
all_clusters = {}
inertia_values = {}
encoder = OneHotEncoder()
encoded_data = encoder.fit_transform(df)
for cluster_size in range(1, 11):
    kmeans = KMeans(cluster_size, n_init = 'auto').fit(encoded_data)
    all_clusters[cluster_size] = kmeans.labels_
    inertia_values[cluster_size] = kmeans.inertia_

# API's
app = Flask(__name__)
CORS(app)

@app.route('/cluster')
@cross_origin(origins=['*'])
def cluster_plot():
    return {'mse': inertia_values}

@app.route('/feature_mds')
@cross_origin(origins=['*'])
def feature_mds_plot():
    mds = []
    for i, col in enumerate(dissimilarity.columns):
        mds.append({'name': col, 'x': float(features_mds[i][0]), 'y': float(features_mds[i][1])})
    return {'mds': mds, 'correlation': correlation.to_json()}

@app.route('/data_mds')
@cross_origin(origins=['*'])
def data_mds_plot():
    k = int(request.args.get('k'))
    mds = []
    for i, (x, y) in enumerate(data_mds):
        mds.append({'cluster': int(all_clusters[k][i])+1, 'x': float(x), 'y': float(y)})
    return mds

@app.route('/pcp_plot')
@cross_origin(origins=['*'])
def pcp_plot():
    k = int(request.args.get('k'))
    df['cluster'] = all_clusters[k] + 1
    return df.to_json(orient='records')
    
    return {}

if __name__ == "__main__":
  app.run(host='localhost', port=8000)