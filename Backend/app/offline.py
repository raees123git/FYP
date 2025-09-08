import os
from huggingface_hub import snapshot_download
from peft import PeftConfig

adapter_path = snapshot_download("raees456/QA_Generation_Model22")
print("✅ Adapter cached at:", adapter_path)

peft_config = PeftConfig.from_pretrained("raees456/QA_Generation_Model22")
base_path = snapshot_download(peft_config.base_model_name_or_path)
print("✅ Base model cached at:", base_path)
