# Directional Rule Grid — Web Version

This is a static browser version of the original Tkinter tool.

## Files

- `index.html`
- `style.css`
- `script.js`

## Deploy to GitHub Pages

1. Create a GitHub repository.
2. Upload these files to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your branch, usually `main`, and the folder `/ (root)`.
6. Save. GitHub will publish the site and give you a Pages URL.

## Notes

- Left click toggles a cell.
- Right click sets the start cell.
- The start cell is displayed and preserved through rotations, matching the original script's behavior.
- Rule execution order matches the original Tkinter app's active implementation, which uses the base traversal order for each rule.
