import kagglehub

# Download latest version
path = kagglehub.dataset_download("toxicloser/ibug-300w-large-face-landmark-dataset")

print("Path to dataset files:", path)