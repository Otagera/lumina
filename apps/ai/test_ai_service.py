import pytest
from httpx import ASGITransport, AsyncClient
from ai_service import app
import uuid
import os

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_process_invalid_uuid():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/process", json={
            "image_path": "/tmp/test.jpg",
            "image_id": "not-a-uuid"
        })
    assert response.status_code == 400
    assert "Invalid UUID" in response.json()["detail"]

@pytest.mark.asyncio
async def test_process_file_not_found(mocker):
    # Mock os.path.exists to return False
    mocker.patch("os.path.exists", return_value=False)
    
    valid_uuid = str(uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/process", json={
            "image_path": "/non/existent/path.jpg",
            "image_id": valid_uuid
        })
    assert response.status_code == 404
    assert "Image file not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_cluster_empty():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/cluster", json={"faces": []})
    assert response.status_code == 200
    assert response.json()["clusters"] == []

@pytest.mark.asyncio
async def test_cluster_single_face():
    face_data = {"face_id": 1, "embedding": [0.1] * 512}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/cluster", json={"faces": [face_data]})
    assert response.status_code == 200
    assert response.json()["clusters"] == [[1]]

@pytest.mark.asyncio
async def test_cluster_multiple_faces():
    # Two identical faces (should cluster) and one very different face (noise)
    # Using cosine distance: [0.1]*512 and [-0.1]*512 are diametrically opposite (distance ~2.0)
    faces = [
        {"face_id": 1, "embedding": [0.1] * 512},
        {"face_id": 2, "embedding": [0.1] * 512},
        {"face_id": 3, "embedding": [-0.1] * 512},
    ]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/cluster", json={"faces": faces})
    
    assert response.status_code == 200
    clusters = response.json()["clusters"]
    
    # We expect one cluster with [1, 2] and one noise cluster with [3]
    # Since they are returned as a list of lists, we check for presence
    assert any(set(c) == {1, 2} for c in clusters)
    assert any(set(c) == {3} for c in clusters)
    assert len(clusters) == 2

@pytest.mark.asyncio
async def test_process_success(mocker):
    # Mock os.path.exists to return True
    mocker.patch("os.path.exists", return_value=True)
    # Mock extract_faces to return a dummy face
    mock_face = {
        "embedding": [0.1] * 512,
        "bounding_box": {"x": 0, "y": 0, "w": 100, "h": 100},
        "det_score": 0.99
    }
    mocker.patch("ai_service.extract_faces", return_value=[mock_face])
    
    valid_uuid = str(uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/process", json={
            "image_path": "/tmp/test.jpg",
            "image_id": valid_uuid
        })
    
    assert response.status_code == 200
    data = response.json()
    assert data["results"][0]["image_id"] == valid_uuid
    assert len(data["results"][0]["faces"]) == 1
    assert data["results"][0]["faces"][0]["det_score"] == 0.99

@pytest.mark.asyncio
async def test_detect_success(mocker):
    # Mock extract_faces to return a dummy face
    mock_face = {
        "embedding": [0.1] * 512,
        "bounding_box": {"left": 0, "top": 0, "right": 100, "bottom": 100},
        "det_score": 0.95
    }
    mocker.patch("ai_service.extract_faces", return_value=[mock_face])
    
    # Create a dummy file content
    file_content = b"fake image content"
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        files = {"file": ("test.jpg", file_content, "image/jpeg")}
        response = await ac.post("/detect", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert "faces" in data
    assert len(data["faces"]) == 1
    assert data["faces"][0]["det_score"] == 0.95
    assert data["faces"][0]["box"]["left"] == 0
