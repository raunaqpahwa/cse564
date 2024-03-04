from constants import metadata
from flask import Flask, request
import pandas as pd
import numpy as np
from flask_cors import cross_origin, CORS
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans

df = pd.read_csv('./data.csv')

# Drop categorical columns
for col in metadata.keys():
    if metadata[col]['isCategorical']:
        df = df.drop(col, axis=1)

# Apply min-max normalisation
df_normalized = (df - df.min()) / (df.max() - df.min())

# Calculate n = 1..10 clusters
all_clusters = {}
inertia_values = {}

for cluster_size in range(1, 11):
    kmeans = KMeans(cluster_size, n_init = 'auto').fit(df_normalized)
    all_clusters[cluster_size] = kmeans.labels_
    inertia_values[cluster_size] = kmeans.inertia_

pca = PCA()
df_transformed = pca.fit_transform(df_normalized)
eigen_values = pca.explained_variance_ratio_
eigen_vectors = pca.components_
loadings = pca.components_.T * np.sqrt(pca.explained_variance_)

# API's
app = Flask(__name__)
CORS(app)

@app.route('/scree')
@cross_origin(origins=['*'])
def scree_plot():
    return {'eigenValues': eigen_values.tolist(), 'eigenVectors': eigen_vectors.tolist()}

@app.route('/cluster')
@cross_origin(origins=['*'])
def cluster_plot():
    return {'mse': inertia_values}

@app.route('/biplot')
@cross_origin(origins=['*'])
def bi_plot():
    points = []
    axis1 = int(request.args.get('axis1')) - 1
    axis2 = int(request.args.get('axis2')) - 1
    k = int(request.args.get('k'))
    features = []
    
    for i, row in enumerate(df_transformed):
        points.append({'axis1': float(row[axis1]), 'axis2': float(row[axis2]), 'pointK': int(all_clusters[k][i])+1})
    
    for i, feature_name in enumerate(pca.feature_names_in_):
        features.append({'name': feature_name, 'axis1': float(loadings[i][axis1]) * 5, 'axis2': float(loadings[i][axis2]) * 5})
    
    return {'points': points, 'kValue': k, 'features': features}

def find_features(di):
    features = []
    for i, feature_name in enumerate(pca.feature_names_in_):
        required_loadings = [val ** 2 for val in loadings[i][:di].tolist()]
        features.append({'name': feature_name, 'loadings': required_loadings, 'loadingSum': sum(required_loadings)})
    return sorted(features, key = lambda x: x['loadingSum'], reverse=True)[:4]

@app.route('/pctable')
@cross_origin(origins=['*'])
def pc_table():
    di = int(request.args.get('di'))
    return find_features(di)
    
@app.route('/scattermatrix')
@cross_origin(origins=['*'])
def scatter_matrix():
    k = int(request.args.get('k'))
    di = int(request.args.get('di'))
    feature_names = [feature['name'] for feature in find_features(di)]
    feature_values = {}
    for feature_name in feature_names:
        feature_values[feature_name] = df_normalized[feature_name].tolist()

    return {'names': feature_names, 'clusterLabels': all_clusters[k].tolist(), 'values': feature_values}





if __name__ == "__main__":
  app.run(host='localhost', port=8000)